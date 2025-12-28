import { type Ticket } from "../../models/ticket.js";

/**
 * Port for accessing ticket data from external systems (e.g., Jira).
 */
export interface TicketRepositoryPort {
  /**
   * Search for tickets using a JQL query.
   * @param jql - JQL query string
   * @param limit - Maximum number of results
   * @returns Array of tickets matching the query
   */
  search(jql: string, limit: number): Promise<Ticket[]>;

  /**
   * Get a specific ticket by its key.
   * @param key - Ticket key (e.g., "TRD-123")
   * @returns The ticket with the specified key
   */
  getByKey(key: string): Promise<Ticket>;

  /**
   * Check if the repository connection is healthy.
   * @returns true if the connection is working
   */
  healthCheck(): Promise<boolean>;
}

