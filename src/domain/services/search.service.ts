import { type SearchResult, type SearchParams } from "../models/ticket.js";
import { type SearchTicketsPort } from "../ports/input/search-tickets.port.js";
import { type LLMInterpreterPort } from "../ports/output/llm-interpreter.port.js";
import { type TicketRepositoryPort } from "../ports/output/ticket-repository.port.js";

/**
 * JQL builder result structure.
 */
export interface JqlBuilderResult {
  jql: string;
  explanation: string[];
}

/**
 * Builds a JQL query from search parameters.
 */
export function buildJql(params: SearchParams): JqlBuilderResult {
  const clauses: string[] = [];
  const explanation: string[] = [];

  if (params.project) {
    clauses.push(`project = "${params.project}"`);
    explanation.push(`Proyecto: ${params.project}`);
  }

  if (params.issueType) {
    clauses.push(`issuetype = "${params.issueType}"`);
    explanation.push(`Tipo: ${params.issueType}`);
  }

  if (params.status) {
    clauses.push(`status = "${params.status}"`);
    explanation.push(`Estado: ${params.status}`);
  }

  if (params.component) {
    clauses.push(`component = "${params.component}"`);
    explanation.push(`Componente: ${params.component}`);
  }

  if (params.textSearch) {
    clauses.push(`text ~ "${escapeJqlString(params.textSearch)}"`);
    explanation.push(`Búsqueda de texto: "${params.textSearch}"`);
  }

  const orderBy = "ORDER BY updated DESC";
  const jql = clauses.length > 0 ? `${clauses.join(" AND ")} ${orderBy}` : orderBy;

  return { jql, explanation };
}

function escapeJqlString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/'/g, "\\'");
}

/**
 * Service that implements the search tickets use case.
 */
export class SearchService implements SearchTicketsPort {
  constructor(
    private readonly llmInterpreter: LLMInterpreterPort,
    private readonly ticketRepository: TicketRepositoryPort,
    private readonly systemPrompt: string
  ) {}

  async execute(query: string, limit: number): Promise<SearchResult> {
    // Check LLM health first
    const llmHealthy = await this.llmInterpreter.healthCheck();
    if (!llmHealthy) {
      throw new Error("No se pudo conectar con el LLM. Asegúrate de que el servidor está corriendo.");
    }

    // Interpret the natural language query
    const searchParams = await this.llmInterpreter.interpretQuery(this.systemPrompt, query);

    // Build JQL from parameters
    const { jql, explanation } = buildJql(searchParams);

    // Execute search
    const tickets = await this.ticketRepository.search(jql, limit);

    return {
      tickets,
      jql,
      explanation,
    };
  }
}

