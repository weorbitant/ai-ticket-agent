import { describe, it, expect } from "@jest/globals";
import { dictionarySchema, formatDictionaryAsContext, type Dictionary } from "./dictionary.js";

describe("dictionarySchema", () => {
  it("should validate a complete dictionary", () => {
    const validDictionary = {
      projects: [
        { key: "PLAT", name: "Platform", description: "Main platform", aliases: ["plat"] },
      ],
      issueTypes: [{ name: "Bug", aliases: ["bug", "error"] }],
      statuses: [{ name: "Open", aliases: ["open", "new"] }],
      components: [{ name: "API", description: "REST API", aliases: ["api"] }],
    };

    const result = dictionarySchema.safeParse(validDictionary);

    expect(result.success).toBe(true);
  });

  it("should validate dictionary without optional descriptions", () => {
    const validDictionary = {
      projects: [{ key: "PLAT", name: "Platform", aliases: ["plat"] }],
      issueTypes: [{ name: "Bug", aliases: ["bug"] }],
      statuses: [{ name: "Open", aliases: ["open"] }],
      components: [{ name: "API", aliases: ["api"] }],
    };

    const result = dictionarySchema.safeParse(validDictionary);

    expect(result.success).toBe(true);
  });

  it("should reject dictionary missing required fields", () => {
    const invalidDictionary = {
      projects: [{ key: "PLAT", name: "Platform" }], // missing aliases
      issueTypes: [],
      statuses: [],
      components: [],
    };

    const result = dictionarySchema.safeParse(invalidDictionary);

    expect(result.success).toBe(false);
  });

  it("should reject dictionary with invalid project key type", () => {
    const invalidDictionary = {
      projects: [{ key: 123, name: "Platform", aliases: [] }],
      issueTypes: [],
      statuses: [],
      components: [],
    };

    const result = dictionarySchema.safeParse(invalidDictionary);

    expect(result.success).toBe(false);
  });

  it("should accept empty arrays", () => {
    const emptyDictionary = {
      projects: [],
      issueTypes: [],
      statuses: [],
      components: [],
    };

    const result = dictionarySchema.safeParse(emptyDictionary);

    expect(result.success).toBe(true);
  });
});

describe("formatDictionaryAsContext", () => {
  it("should format dictionary as readable context", () => {
    const dictionary: Dictionary = {
      projects: [{ key: "PLAT", name: "Platform", description: "Main platform", aliases: [] }],
      issueTypes: [{ name: "Bug", aliases: [] }],
      statuses: [{ name: "Open", aliases: [] }],
      components: [{ name: "API", description: "REST API", aliases: [] }],
    };

    const context = formatDictionaryAsContext(dictionary);

    expect(context).toContain("## Proyectos disponibles:");
    expect(context).toContain("- PLAT: Platform (Main platform)");
    expect(context).toContain("## Tipos de issue:");
    expect(context).toContain("- Bug");
    expect(context).toContain("## Estados:");
    expect(context).toContain("- Open");
    expect(context).toContain("## Componentes:");
    expect(context).toContain("- API: REST API");
  });

  it("should format projects without description", () => {
    const dictionary: Dictionary = {
      projects: [{ key: "PLAT", name: "Platform", aliases: [] }],
      issueTypes: [],
      statuses: [],
      components: [],
    };

    const context = formatDictionaryAsContext(dictionary);

    expect(context).toContain("- PLAT: Platform");
    expect(context).not.toContain("(");
  });

  it("should format components without description", () => {
    const dictionary: Dictionary = {
      projects: [],
      issueTypes: [],
      statuses: [],
      components: [{ name: "API", aliases: [] }],
    };

    const context = formatDictionaryAsContext(dictionary);

    expect(context).toContain("- API");
    // Should not have "- API: something" format, just "- API"
    expect(context).not.toContain("- API:");
  });

  it("should handle multiple items in each category", () => {
    const dictionary: Dictionary = {
      projects: [
        { key: "PLAT", name: "Platform", aliases: [] },
        { key: "CORE", name: "Core System", aliases: [] },
      ],
      issueTypes: [
        { name: "Bug", aliases: [] },
        { name: "Story", aliases: [] },
      ],
      statuses: [
        { name: "Open", aliases: [] },
        { name: "Done", aliases: [] },
      ],
      components: [
        { name: "API", aliases: [] },
        { name: "DB", aliases: [] },
      ],
    };

    const context = formatDictionaryAsContext(dictionary);

    expect(context).toContain("- PLAT: Platform");
    expect(context).toContain("- CORE: Core System");
    expect(context).toContain("- Bug");
    expect(context).toContain("- Story");
    expect(context).toContain("- Open");
    expect(context).toContain("- Done");
  });

  it("should handle empty dictionary", () => {
    const dictionary: Dictionary = {
      projects: [],
      issueTypes: [],
      statuses: [],
      components: [],
    };

    const context = formatDictionaryAsContext(dictionary);

    expect(context).toContain("## Proyectos disponibles:");
    expect(context).toContain("## Tipos de issue:");
    expect(context).toContain("## Estados:");
    expect(context).toContain("## Componentes:");
  });
});

