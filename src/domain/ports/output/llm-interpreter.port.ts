import { type SearchParams } from "../../models/ticket.js";
import { type EvaluationResult, type EstimationResult } from "../../models/estimation.js";

/**
 * Port for LLM interpretation capabilities.
 * The LLM acts as a natural language interpreter, never executing actions directly.
 */
export interface LLMInterpreterPort {
  /**
   * Interpret a natural language query into structured search parameters.
   * @param context - System context/prompt for the LLM
   * @param query - User's natural language query
   * @returns Structured search parameters
   */
  interpretQuery(context: string, query: string): Promise<SearchParams>;

  /**
   * Evaluate if a ticket description is adequate.
   * @param description - The ticket description to evaluate
   * @returns Evaluation result with feedback
   */
  evaluateDescription(description: string): Promise<EvaluationResult>;

  /**
   * Evaluate if a ticket title is clear and adequate.
   * @param title - The ticket title to evaluate
   * @returns Evaluation result with feedback
   */
  evaluateTitle(title: string): Promise<EvaluationResult>;

  /**
   * Estimate the effort/complexity of a ticket in Fibonacci points.
   * @param summary - The ticket summary/title
   * @param description - The ticket description
   * @param repositoryContext - Context from GitHub repositories
   * @returns Estimation with points and reasoning
   */
  estimateEffort(
    summary: string,
    description: string,
    repositoryContext: string
  ): Promise<EstimationResult>;

  /**
   * Check if the LLM service is healthy and available.
   * @returns true if the service is available
   */
  healthCheck(): Promise<boolean>;
}

