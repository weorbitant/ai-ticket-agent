import { describe, it, expect } from "@jest/globals";
import { buildJql, formatJqlForDisplay } from "./jql-builder.js";
import { type SearchParams } from "../../../domain/models/ticket.js";

describe("buildJql", () => {
  it("should return only ORDER BY when all params are null", () => {
    const params: SearchParams = {
      project: null,
      issueType: null,
      status: null,
      component: null,
      textSearch: null,
    };

    const result = buildJql(params);

    expect(result.jql).toBe("ORDER BY updated DESC");
    expect(result.explanation).toHaveLength(0);
  });

  it("should build JQL with project filter", () => {
    const params: SearchParams = {
      project: "PLAT",
      issueType: null,
      status: null,
      component: null,
      textSearch: null,
    };

    const result = buildJql(params);

    expect(result.jql).toBe('project = "PLAT" ORDER BY updated DESC');
    expect(result.explanation).toContain("Proyecto: PLAT");
  });

  it("should build JQL with multiple filters", () => {
    const params: SearchParams = {
      project: "PLAT",
      issueType: "Bug",
      status: "Open",
      component: null,
      textSearch: null,
    };

    const result = buildJql(params);

    expect(result.jql).toBe(
      'project = "PLAT" AND issuetype = "Bug" AND status = "Open" ORDER BY updated DESC'
    );
    expect(result.explanation).toHaveLength(3);
    expect(result.explanation).toContain("Proyecto: PLAT");
    expect(result.explanation).toContain("Tipo: Bug");
    expect(result.explanation).toContain("Estado: Open");
  });

  it("should build JQL with all filters", () => {
    const params: SearchParams = {
      project: "PLAT",
      issueType: "Bug",
      status: "Open",
      component: "Ingestion",
      textSearch: "error login",
    };

    const result = buildJql(params);

    expect(result.jql).toContain('project = "PLAT"');
    expect(result.jql).toContain('issuetype = "Bug"');
    expect(result.jql).toContain('status = "Open"');
    expect(result.jql).toContain('component = "Ingestion"');
    expect(result.jql).toContain('text ~ "error login"');
    expect(result.jql).toContain("ORDER BY updated DESC");
  });

  it("should escape special characters in text search", () => {
    const params: SearchParams = {
      project: null,
      issueType: null,
      status: null,
      component: null,
      textSearch: 'test "quoted" value',
    };

    const result = buildJql(params);

    expect(result.jql).toContain('text ~ "test \\"quoted\\" value"');
  });

  it("should escape backslashes in text search", () => {
    const params: SearchParams = {
      project: null,
      issueType: null,
      status: null,
      component: null,
      textSearch: "path\\to\\file",
    };

    const result = buildJql(params);

    expect(result.jql).toContain('text ~ "path\\\\to\\\\file"');
  });
});

describe("formatJqlForDisplay", () => {
  it("should return default message when no filters", () => {
    const result = {
      jql: "ORDER BY updated DESC",
      explanation: [],
    };

    expect(formatJqlForDisplay(result)).toBe("Búsqueda: Todos los issues (sin filtros específicos)");
  });

  it("should format explanation with bullet points", () => {
    const result = {
      jql: 'project = "PLAT" ORDER BY updated DESC',
      explanation: ["Proyecto: PLAT", "Estado: Open"],
    };

    const formatted = formatJqlForDisplay(result);

    expect(formatted).toContain("Búsqueda:");
    expect(formatted).toContain("  • Proyecto: PLAT");
    expect(formatted).toContain("  • Estado: Open");
  });
});

