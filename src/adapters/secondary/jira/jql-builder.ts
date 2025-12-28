import { type SearchParams } from "../../../domain/models/ticket.js";
import { type JqlBuilderResult } from "../../../domain/services/search.service.js";

/**
 * Builds a JQL query from search parameters.
 * This is kept in the adapter layer as it's Jira-specific.
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
 * Formats a JQL result for display.
 */
export function formatJqlForDisplay(result: JqlBuilderResult): string {
  if (result.explanation.length === 0) {
    return "Búsqueda: Todos los issues (sin filtros específicos)";
  }

  return `Búsqueda:\n${result.explanation.map((e) => `  • ${e}`).join("\n")}`;
}

