import {
  type EstimateEffortPort,
  type EstimateEffortResult,
} from "../ports/input/estimate-effort.port.js";
import { type LLMInterpreterPort } from "../ports/output/llm-interpreter.port.js";
import { type TicketRepositoryPort } from "../ports/output/ticket-repository.port.js";
import { type CodeContextProviderPort } from "../ports/output/code-context-provider.port.js";

/**
 * Service that implements the estimate effort use case.
 */
export class EstimatorService implements EstimateEffortPort {
  constructor(
    private readonly ticketRepository: TicketRepositoryPort,
    private readonly llmInterpreter: LLMInterpreterPort,
    private readonly codeContextProvider: CodeContextProviderPort
  ) {}

  async execute(ticketKey: string, sourcesPath?: string): Promise<EstimateEffortResult> {
    // Check LLM health first
    const llmHealthy = await this.llmInterpreter.healthCheck();
    if (!llmHealthy) {
      throw new Error("No se pudo conectar con el LLM. Asegúrate de que el servidor está corriendo.");
    }

    // Fetch ticket from repository
    const ticket = await this.ticketRepository.getByKey(ticketKey);

    // Get repository context (optional, may fail)
    let repositoryContext = "";
    try {
      repositoryContext = await this.codeContextProvider.getContext(sourcesPath);
    } catch {
      // Continue without GitHub context
    }

    // Extract description text
    const descriptionText = this.extractTextFromDescription(ticket.description);

    // Estimate effort using LLM
    const estimation = await this.llmInterpreter.estimateEffort(
      ticket.summary,
      descriptionText,
      repositoryContext
    );

    return {
      ticket,
      estimation,
    };
  }

  /**
   * Extracts plain text from Jira description (handles ADF format).
   */
  private extractTextFromDescription(description: unknown): string {
    if (!description) return "";
    if (typeof description === "string") return description;

    // Handle Atlassian Document Format (ADF)
    if (typeof description === "object" && description !== null) {
      const adf = description as { content?: Array<{ content?: Array<{ text?: string }> }> };
      if (adf.content && Array.isArray(adf.content)) {
        const texts: string[] = [];
        for (const block of adf.content) {
          if (block.content && Array.isArray(block.content)) {
            for (const inline of block.content) {
              if (inline.text) {
                texts.push(inline.text);
              }
            }
          }
        }
        return texts.join("\n");
      }
    }

    return "";
  }
}

