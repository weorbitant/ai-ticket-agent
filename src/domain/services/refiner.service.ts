import {
  type RefineTicketPort,
  type RefineTicketOptions,
  type RefineTicketResult,
} from "../ports/input/refine-ticket.port.js";
import { type LLMInterpreterPort } from "../ports/output/llm-interpreter.port.js";
import { type TicketRepositoryPort } from "../ports/output/ticket-repository.port.js";
import {
  type CodeContextProviderPort,
  type LoadedFileSummary,
} from "../ports/output/code-context-provider.port.js";

/**
 * Service that implements the refine ticket use case.
 */
export class RefinerService implements RefineTicketPort {
  constructor(
    private readonly ticketRepository: TicketRepositoryPort,
    private readonly llmInterpreter: LLMInterpreterPort,
    private readonly codeContextProvider: CodeContextProviderPort
  ) {}

  async execute(ticketKey: string, options?: RefineTicketOptions): Promise<RefineTicketResult> {
    // Check LLM health first
    const llmHealthy = await this.llmInterpreter.healthCheck();
    if (!llmHealthy) {
      throw new Error("No se pudo conectar con el LLM. Asegúrate de que el servidor está corriendo.");
    }

    // Fetch ticket from repository
    const ticket = await this.ticketRepository.getByKey(ticketKey);

    // Get repository context (optional, may fail)
    let repositoryContext = "";
    let loadedFiles: LoadedFileSummary[] = [];
    try {
      const contextResult = await this.codeContextProvider.getContext(options?.sourcesPath);
      repositoryContext = contextResult.content;
      loadedFiles = contextResult.loadedFiles;
    } catch {
      // Continue without GitHub context
    }

    // Extract description text
    const descriptionText = this.extractTextFromDescription(ticket.description);

    // Refine ticket using LLM
    const refinement = await this.llmInterpreter.refineTicket(
      ticket.summary,
      descriptionText,
      repositoryContext,
      options?.userContext
    );

    return {
      ticket,
      refinement,
      loadedFiles,
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

