import { type QualityReport } from "../models/ticket.js";
import { type CheckTicketQualityPort } from "../ports/input/check-ticket-quality.port.js";
import { type LLMInterpreterPort } from "../ports/output/llm-interpreter.port.js";
import { type TicketRepositoryPort } from "../ports/output/ticket-repository.port.js";

/**
 * Service that implements the check ticket quality use case.
 */
export class QualityCheckerService implements CheckTicketQualityPort {
  constructor(
    private readonly ticketRepository: TicketRepositoryPort,
    private readonly llmInterpreter: LLMInterpreterPort
  ) {}

  async execute(ticketKey: string): Promise<QualityReport> {
    // Fetch ticket from repository
    const ticket = await this.ticketRepository.getByKey(ticketKey);

    // Check basic criteria
    const hasComponent = ticket.components.length > 0;
    const hasStoryPoints = ticket.storyPoints !== null && ticket.storyPoints > 0;

    // Check LLM availability for evaluations
    const llmHealthy = await this.llmInterpreter.healthCheck();

    let descriptionEvaluation: { isAdequate: boolean; feedback: string };
    let titleEvaluation: { isAdequate: boolean; feedback: string };

    if (!llmHealthy) {
      descriptionEvaluation = {
        isAdequate: false,
        feedback: "No se pudo conectar con el LLM para evaluar la descripción.",
      };
      titleEvaluation = {
        isAdequate: false,
        feedback: "No se pudo conectar con el LLM para evaluar el título.",
      };
    } else {
      // Extract text from description for evaluation
      const descriptionText = this.extractTextFromDescription(ticket.description);

      // Evaluate description
      descriptionEvaluation = await this.llmInterpreter.evaluateDescription(descriptionText);

      // Evaluate title
      titleEvaluation = await this.llmInterpreter.evaluateTitle(ticket.summary);
    }

    // Calculate passed checks
    const checks = [
      hasComponent,
      hasStoryPoints,
      descriptionEvaluation.isAdequate,
      titleEvaluation.isAdequate,
    ];
    const passedChecks = checks.filter(Boolean).length;
    const totalChecks = checks.length;

    return {
      ticket,
      hasComponent,
      hasStoryPoints,
      descriptionEvaluation,
      titleEvaluation,
      passedChecks,
      totalChecks,
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

