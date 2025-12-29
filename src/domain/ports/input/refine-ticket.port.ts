import { type RefinementResult } from "../../models/refinement.js";
import { type Ticket } from "../../models/ticket.js";
import { type LoadedFileSummary } from "../output/code-context-provider.port.js";

/**
 * Options for the refine ticket use case.
 */
export interface RefineTicketOptions {
  /** Optional path to GitHub sources configuration */
  sourcesPath?: string;
  /** Optional additional context provided by the user */
  userContext?: string;
}

/**
 * Result of the refine ticket use case.
 */
export interface RefineTicketResult {
  ticket: Ticket;
  refinement: RefinementResult;
  /** Summary of GitHub files loaded for context (for verbose output) */
  loadedFiles: LoadedFileSummary[];
}

/**
 * Use case port for refining a ticket with additional structure and context.
 */
export interface RefineTicketPort {
  /**
   * Refine a ticket by adding context, tasks, acceptance criteria, etc.
   * @param ticketKey - The ticket key to refine (e.g., "TRD-123")
   * @param options - Optional configuration for the refinement
   * @returns Refinement result with structured content
   */
  execute(ticketKey: string, options?: RefineTicketOptions): Promise<RefineTicketResult>;
}

