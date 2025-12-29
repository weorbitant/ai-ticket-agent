import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { type SearchParams, searchParamsSchema } from "../../../domain/models/ticket.js";
import {
  type EvaluationResult,
  type EstimationResult,
  type FibonacciPoints,
  VALID_FIBONACCI_POINTS,
  nearestFibonacci,
} from "../../../domain/models/estimation.js";
import { type LLMInterpreterPort } from "../../../domain/ports/output/llm-interpreter.port.js";
import {
  type RefinementResult,
  createEmptyRefinement,
} from "../../../domain/models/refinement.js";
import {
  DESCRIPTION_EVALUATION_PROMPT,
  buildDescriptionEvaluationPrompt,
  TITLE_EVALUATION_PROMPT,
  buildTitleEvaluationPrompt,
  ESTIMATION_PROMPT,
  buildEstimationPrompt,
  REFINEMENT_PROMPT,
  buildRefinementPrompt,
} from "./prompts.js";

// JSON Schema for LLM response - using raw JSON Schema instead of Zod
// because llama.cpp requires function.description which Zod's toJsonSchema doesn't preserve
const llmOutputJsonSchema = {
  name: "search_params",
  description: "Parámetros extraídos de la consulta del usuario para buscar tickets en Jira",
  parameters: {
    type: "object",
    properties: {
      project: {
        type: "string",
        nullable: true,
        description: "KEY del proyecto en Jira (ej: TRD) o null si no se especifica",
      },
      issueType: {
        oneOf: [
          { type: "string" },
          { type: "array", items: { type: "string" } },
        ],
        nullable: true,
        description:
          "Tipo de issue. Un string si es uno solo, o un array de strings si son varios. Ej: 'Bug' o ['Bug', 'Task']. null si no se especifica",
      },
      status: {
        oneOf: [
          { type: "string" },
          { type: "array", items: { type: "string" } },
        ],
        nullable: true,
        description:
          "Estado del ticket. Un string si es uno solo, o un array de strings si son varios. Ej: 'Open' o ['Open', 'In Progress']. null si no se especifica",
      },
      component: {
        oneOf: [
          { type: "string" },
          { type: "array", items: { type: "string" } },
        ],
        nullable: true,
        description:
          "Componente del ticket. Un string si es uno solo, o un array de strings si son varios. Ej: 'API' o ['API', 'Frontend']. null si no se especifica",
      },
      textSearch: {
        type: "string",
        nullable: true,
        description: "Texto adicional para buscar en el contenido del ticket o null",
      },
    },
    required: ["project", "issueType", "status", "component", "textSearch"],
  },
};

export interface LangChainAdapterOptions {
  baseUrl: string;
  temperature?: number;
  timeout?: number;
}

/**
 * LangChain adapter implementing LLMInterpreterPort.
 */
export class LangChainAdapter implements LLMInterpreterPort {
  private model: ChatOpenAI;
  private structuredModel: ReturnType<ChatOpenAI["withStructuredOutput"]>;
  private baseUrl: string;

  constructor(options: LangChainAdapterOptions) {
    this.baseUrl = options.baseUrl;

    this.model = new ChatOpenAI({
      openAIApiKey: "not-needed", // llama.cpp doesn't need API key
      configuration: {
        baseURL: `${options.baseUrl}/v1`,
      },
      temperature: options.temperature ?? 0.1,
      timeout: options.timeout ?? 120000,
    });

    // Create structured output model with JSON Schema (not Zod)
    // llama.cpp requires function.description which LangChain's Zod conversion doesn't preserve
    this.structuredModel = this.model.withStructuredOutput(llmOutputJsonSchema);
  }

  async interpretQuery(systemPrompt: string, userQuery: string): Promise<SearchParams> {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ["human", "{query}"],
    ]);

    const chain = prompt.pipe(this.structuredModel);

    try {
      const result = await chain.invoke({ query: userQuery });
      const validated = searchParamsSchema.parse(result);
      return validated;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("ECONNREFUSED") || error.message.includes("fetch failed")) {
          throw new Error(
            `No se pudo conectar con el LLM. Asegúrate de que llama.cpp está corriendo en ${this.baseUrl}`
          );
        }
        throw new Error(`Error al interpretar la consulta: ${error.message}`);
      }
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async evaluateDescription(description: string): Promise<EvaluationResult> {
    if (!description || description.trim() === "") {
      return {
        isAdequate: false,
        feedback: "La descripción está vacía o no existe.",
      };
    }

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", DESCRIPTION_EVALUATION_PROMPT],
      ["human", "{description}"],
    ]);

    try {
      const chain = prompt.pipe(this.model);
      const result = await chain.invoke({
        description: buildDescriptionEvaluationPrompt(description),
      });

      const content = typeof result.content === "string" ? result.content : String(result.content);
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return {
          isAdequate: false,
          feedback: "No se pudo evaluar la descripción correctamente.",
        };
      }

      const parsed = JSON.parse(jsonMatch[0]) as EvaluationResult;
      return {
        isAdequate: Boolean(parsed.isAdequate),
        feedback: String(parsed.feedback || "Sin comentarios adicionales."),
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("ECONNREFUSED") || error.message.includes("fetch failed")) {
          throw new Error(
            `No se pudo conectar con el LLM. Asegúrate de que llama.cpp está corriendo en ${this.baseUrl}`
          );
        }
      }
      return {
        isAdequate: false,
        feedback: "Error al evaluar la descripción.",
      };
    }
  }

  async evaluateTitle(title: string): Promise<EvaluationResult> {
    if (!title || title.trim() === "") {
      return {
        isAdequate: false,
        feedback: "El título está vacío o no existe.",
      };
    }

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", TITLE_EVALUATION_PROMPT],
      ["human", "{title}"],
    ]);

    try {
      const chain = prompt.pipe(this.model);
      const result = await chain.invoke({
        title: buildTitleEvaluationPrompt(title),
      });

      const content = typeof result.content === "string" ? result.content : String(result.content);
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return {
          isAdequate: false,
          feedback: "No se pudo evaluar el título correctamente.",
        };
      }

      const parsed = JSON.parse(jsonMatch[0]) as EvaluationResult;
      return {
        isAdequate: Boolean(parsed.isAdequate),
        feedback: String(parsed.feedback || "Sin comentarios adicionales."),
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("ECONNREFUSED") || error.message.includes("fetch failed")) {
          throw new Error(
            `No se pudo conectar con el LLM. Asegúrate de que llama.cpp está corriendo en ${this.baseUrl}`
          );
        }
      }
      return {
        isAdequate: false,
        feedback: "Error al evaluar el título.",
      };
    }
  }

  async estimateEffort(
    summary: string,
    description: string,
    repositoryContext: string,
    userContext?: string
  ): Promise<EstimationResult> {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", ESTIMATION_PROMPT],
      ["human", "{content}"],
    ]);

    try {
      const chain = prompt.pipe(this.model);
      const result = await chain.invoke({
        content: buildEstimationPrompt(summary, description, repositoryContext, userContext),
      });

      const content = typeof result.content === "string" ? result.content : String(result.content);
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        return {
          points: 5,
          reasoning: "No se pudo obtener una estimación estructurada. Se asigna valor medio por defecto.",
        };
      }

      const parsed = JSON.parse(jsonMatch[0]) as { points: number; reasoning: string };

      const points = VALID_FIBONACCI_POINTS.includes(parsed.points as FibonacciPoints)
        ? (parsed.points as FibonacciPoints)
        : nearestFibonacci(parsed.points);

      return {
        points,
        reasoning: String(parsed.reasoning || "Sin razonamiento proporcionado."),
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("ECONNREFUSED") || error.message.includes("fetch failed")) {
          throw new Error(
            `No se pudo conectar con el LLM. Asegúrate de que llama.cpp está corriendo en ${this.baseUrl}`
          );
        }
      }
      return {
        points: 5,
        reasoning: "Error al estimar el ticket. Se asigna valor medio por defecto.",
      };
    }
  }

  async refineTicket(
    summary: string,
    description: string,
    repositoryContext: string,
    userContext?: string
  ): Promise<RefinementResult> {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", REFINEMENT_PROMPT],
      ["human", "{content}"],
    ]);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/5e7dbc62-7a1e-4549-bbed-73311f6a0822',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'langchain.adapter.ts:refineTicket:entry',message:'refineTicket called',data:{summaryLen:summary?.length,descLen:description?.length,repoCtxLen:repositoryContext?.length,userCtxLen:userContext?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A-B'})}).catch(()=>{});
    // #endregion

    try {
      const chain = prompt.pipe(this.model);
      const builtPrompt = buildRefinementPrompt(summary, description, repositoryContext, userContext);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5e7dbc62-7a1e-4549-bbed-73311f6a0822',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'langchain.adapter.ts:refineTicket:beforeInvoke',message:'About to invoke LLM',data:{promptLen:builtPrompt?.length,promptPreview:builtPrompt?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const result = await chain.invoke({
        content: builtPrompt,
      });

      const content = typeof result.content === "string" ? result.content : String(result.content);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5e7dbc62-7a1e-4549-bbed-73311f6a0822',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'langchain.adapter.ts:refineTicket:llmResponse',message:'LLM response received',data:{contentLen:content?.length,contentPreview:content?.substring(0,1000),contentFull:content},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A-B'})}).catch(()=>{});
      // #endregion
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5e7dbc62-7a1e-4549-bbed-73311f6a0822',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'langchain.adapter.ts:refineTicket:jsonMatch',message:'JSON regex result',data:{matched:!!jsonMatch,matchedContent:jsonMatch?.[0]?.substring(0,500)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (!jsonMatch) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/5e7dbc62-7a1e-4549-bbed-73311f6a0822',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'langchain.adapter.ts:refineTicket:noJsonMatch',message:'No JSON found in response',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return createEmptyRefinement();
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        suggestedTitle?: string | null;
        context?: string;
        tasks?: string[];
        acceptanceCriteria?: string[];
        additionalNotes?: string | null;
        warnings?: string[];
        isComplete?: boolean;
      };

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5e7dbc62-7a1e-4549-bbed-73311f6a0822',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'langchain.adapter.ts:refineTicket:parsed',message:'JSON parsed successfully',data:{hasContext:!!parsed.context,tasksCount:parsed.tasks?.length,criteriaCount:parsed.acceptanceCriteria?.length,parsedKeys:Object.keys(parsed)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      // Normalize and validate the result
      const warnings: string[] = Array.isArray(parsed.warnings) ? parsed.warnings : [];
      const tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
      const acceptanceCriteria = Array.isArray(parsed.acceptanceCriteria)
        ? parsed.acceptanceCriteria
        : [];
      const context = typeof parsed.context === "string" ? parsed.context : "";

      // Add warnings for missing required fields
      if (!context || context.trim() === "") {
        warnings.push("No se pudo generar el contexto del ticket");
      }
      if (tasks.length === 0) {
        warnings.push("No se pudieron identificar las tareas técnicas");
      }
      if (acceptanceCriteria.length === 0) {
        warnings.push("No se pudieron generar criterios de aceptación");
      }

      return {
        suggestedTitle:
          parsed.suggestedTitle === "null" || parsed.suggestedTitle === ""
            ? null
            : parsed.suggestedTitle ?? null,
        context,
        tasks,
        acceptanceCriteria,
        additionalNotes:
          parsed.additionalNotes === "null" || parsed.additionalNotes === ""
            ? null
            : parsed.additionalNotes ?? null,
        warnings,
        isComplete: warnings.length === 0,
      };
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/5e7dbc62-7a1e-4549-bbed-73311f6a0822',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'langchain.adapter.ts:refineTicket:catch',message:'Exception caught',data:{errorMsg:error instanceof Error ? error.message : String(error),errorStack:error instanceof Error ? error.stack : ''},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      if (error instanceof Error) {
        if (error.message.includes("ECONNREFUSED") || error.message.includes("fetch failed")) {
          throw new Error(
            `No se pudo conectar con el LLM. Asegúrate de que llama.cpp está corriendo en ${this.baseUrl}`
          );
        }
      }
      return createEmptyRefinement();
    }
  }
}

