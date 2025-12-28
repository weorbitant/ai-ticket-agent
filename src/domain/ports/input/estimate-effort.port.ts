import { type EstimationResult } from "../../models/estimation.js";
import { type Ticket } from "../../models/ticket.js";

/**
 * Result of the estimate effort use case.
 */
export interface EstimateEffortResult {
  ticket: Ticket;
  estimation: EstimationResult;
}

/**
 * Use case port for estimating ticket effort.
 */
export interface EstimateEffortPort {
  /**
   * Estimate the effort for a ticket using repository context.
   * @param ticketKey - The ticket key to estimate (e.g., "TRD-123")
   * @param sourcesPath - Optional path to GitHub sources configuration
   * @returns Estimation result with points and reasoning
   */
  execute(ticketKey: string, sourcesPath?: string): Promise<EstimateEffortResult>;
}

