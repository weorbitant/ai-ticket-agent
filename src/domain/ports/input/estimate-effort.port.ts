import { type EstimationResult } from "../../models/estimation.js";
import { type Ticket } from "../../models/ticket.js";
import { type LoadedFileSummary } from "../output/code-context-provider.port.js";

/**
 * Options for the estimate effort use case.
 */
export interface EstimateEffortOptions {
  /** Optional path to GitHub sources configuration */
  sourcesPath?: string;
  /** Optional critical context provided by the user for the estimation */
  userContext?: string;
}

/**
 * Result of the estimate effort use case.
 */
export interface EstimateEffortResult {
  ticket: Ticket;
  estimation: EstimationResult;
  /** Summary of GitHub files loaded for context (for verbose output) */
  loadedFiles: LoadedFileSummary[];
}

/**
 * Use case port for estimating ticket effort.
 */
export interface EstimateEffortPort {
  /**
   * Estimate the effort for a ticket using repository context.
   * @param ticketKey - The ticket key to estimate (e.g., "TRD-123")
   * @param options - Optional configuration for the estimation
   * @returns Estimation result with points and reasoning
   */
  execute(ticketKey: string, options?: EstimateEffortOptions): Promise<EstimateEffortResult>;
}

