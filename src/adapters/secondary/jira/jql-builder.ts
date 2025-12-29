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
    if (Array.isArray(params.issueType)) {
      if (params.issueType.length === 1) {
        clauses.push(`issuetype = "${params.issueType[0]}"`);
        explanation.push(`Tipo: ${params.issueType[0]}`);
      } else {
        const types = params.issueType.map((t) => `"${t}"`).join(", ");
        clauses.push(`issuetype IN (${types})`);
        explanation.push(`Tipos: ${params.issueType.join(", ")}`);
      }
    } else {
      clauses.push(`issuetype = "${params.issueType}"`);
      explanation.push(`Tipo: ${params.issueType}`);
    }
  }

  if (params.status) {
    if (Array.isArray(params.status)) {
      if (params.status.length === 1) {
        clauses.push(`status = "${params.status[0]}"`);
        explanation.push(`Estado: ${params.status[0]}`);
      } else {
        const statuses = params.status.map((s) => `"${s}"`).join(", ");
        clauses.push(`status IN (${statuses})`);
        explanation.push(`Estados: ${params.status.join(", ")}`);
      }
    } else {
      clauses.push(`status = "${params.status}"`);
      explanation.push(`Estado: ${params.status}`);
    }
  }

  if (params.component) {
    if (Array.isArray(params.component)) {
      if (params.component.length === 1) {
        clauses.push(`component = "${params.component[0]}"`);
        explanation.push(`Componente: ${params.component[0]}`);
      } else {
        const components = params.component.map((c) => `"${c}"`).join(", ");
        clauses.push(`component IN (${components})`);
        explanation.push(`Componentes: ${params.component.join(", ")}`);
      }
    } else {
      clauses.push(`component = "${params.component}"`);
      explanation.push(`Componente: ${params.component}`);
    }
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

