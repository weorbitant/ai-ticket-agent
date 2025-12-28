import { type QualityReport } from "../../models/ticket.js";

/**
 * Use case port for checking ticket quality.
 */
export interface CheckTicketQualityPort {
  /**
   * Analyze a ticket and evaluate its quality criteria.
   * @param ticketKey - The ticket key to analyze (e.g., "TRD-123")
   * @returns Quality report with all evaluation results
   */
  execute(ticketKey: string): Promise<QualityReport>;
}

