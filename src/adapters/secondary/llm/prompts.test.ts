import { describe, it, expect } from "@jest/globals";
import { getSystemPrompt, SYSTEM_PROMPT } from "./prompts.js";

describe("getSystemPrompt", () => {
  it("should return the system prompt", () => {
    const prompt = getSystemPrompt();

    expect(prompt).toBe(SYSTEM_PROMPT);
  });

  it("should include Jira configuration context", () => {
    const prompt = getSystemPrompt();

    // Project
    expect(prompt).toContain("TRD");
    expect(prompt).toContain("Transformación Digital");

    // Issue types
    expect(prompt).toContain("Epic");
    expect(prompt).toContain("Task");

    // Statuses
    expect(prompt).toContain("Nueva");
    expect(prompt).toContain("En Progreso");
    expect(prompt).toContain("Cerrada");

    // Components
    expect(prompt).toContain("Plataforma del Dato");
    expect(prompt).toContain("PGI");
    expect(prompt).toContain("CRM");
  });

  it("should include instructions for the LLM", () => {
    const prompt = getSystemPrompt();

    expect(prompt).toContain("parámetros de búsqueda");
    expect(prompt).toContain("null");
  });

  it("should include all available statuses", () => {
    const prompt = getSystemPrompt();

    const expectedStatuses = [
      "Nueva",
      "Preparada para empezar",
      "En Progreso",
      "Pendiente cliente",
      "Pendiente terceros",
      "Pendiente dto. interno",
      "En Revisión",
      "Cerrada",
      "Desestimada",
    ];

    for (const status of expectedStatuses) {
      expect(prompt).toContain(status);
    }
  });

  it("should include all available components", () => {
    const prompt = getSystemPrompt();

    const expectedComponents = ["Plataforma del Dato", "PGI", "CRM"];

    for (const component of expectedComponents) {
      expect(prompt).toContain(component);
    }
  });
});

