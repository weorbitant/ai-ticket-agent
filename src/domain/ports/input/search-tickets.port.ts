import { type SearchResult } from "../../models/ticket.js";

/**
 * Use case port for searching tickets with natural language.
 */
export interface SearchTicketsPort {
  /**
   * Execute a natural language search for tickets.
   * @param query - Natural language query from the user
   * @param limit - Maximum number of results to return
   * @returns Search result with tickets and JQL information
   */
  execute(query: string, limit: number): Promise<SearchResult>;
}

