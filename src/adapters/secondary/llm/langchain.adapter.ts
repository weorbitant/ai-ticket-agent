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
  DESCRIPTION_EVALUATION_PROMPT,
  buildDescriptionEvaluationPrompt,
  TITLE_EVALUATION_PROMPT,
  buildTitleEvaluationPrompt,
  ESTIMATION_PROMPT,
  buildEstimationPrompt,
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
        type: "string",
        nullable: true,
        description: "Nombre exacto del tipo de issue (Epic, Tarea) o null si no se especifica",
      },
      status: {
        type: "string",
        nullable: true,
        description: "Nombre exacto del estado del ticket o null si no se especifica",
      },
      component: {
        type: "string",
        nullable: true,
        description: "Nombre exacto del componente o null si no se especifica",
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
    repositoryContext: string
  ): Promise<EstimationResult> {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", ESTIMATION_PROMPT],
      ["human", "{content}"],
    ]);

    try {
      const chain = prompt.pipe(this.model);
      const result = await chain.invoke({
        content: buildEstimationPrompt(summary, description, repositoryContext),
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
}

