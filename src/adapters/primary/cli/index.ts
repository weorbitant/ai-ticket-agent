#!/usr/bin/env node

import { Command } from "commander";

// Commands that don't require configuration
import { createInitCommand } from "./init.command.js";
import { createConfigCommand } from "./config.command.js";

// Formatters
import { displaySearchResult, displayQualityReport, displayEstimationResult, displayRefinementResult } from "./formatters.js";

/**
 * Lazily initializes services and adapters only when needed.
 * This allows config-free commands (init, config) to run without .env
 */
async function initializeServices() {
  const { appConfig } = await import("../../../config/index.js");
  const { SearchService } = await import("../../../domain/services/search.service.js");
  const { QualityCheckerService } = await import(
    "../../../domain/services/quality-checker.service.js"
  );
  const { EstimatorService } = await import("../../../domain/services/estimator.service.js");
  const { RefinerService } = await import("../../../domain/services/refiner.service.js");
  const { JiraAdapter } = await import("../../secondary/jira/jira.adapter.js");
  const { LangChainAdapter } = await import("../../secondary/llm/langchain.adapter.js");
  const { GitHubAdapter } = await import("../../secondary/github/github.adapter.js");
  const { getSystemPrompt } = await import("../../secondary/llm/prompts.js");

  const jiraAdapter = new JiraAdapter({
    baseUrl: appConfig.jira.baseUrl,
    email: appConfig.jira.email,
    apiToken: appConfig.jira.apiToken,
  });

  const llmAdapter = new LangChainAdapter({
    baseUrl: appConfig.llama.baseUrl,
  });

  const githubAdapter = new GitHubAdapter({
    token: appConfig.github?.token,
  });

  return {
    searchService: new SearchService(llmAdapter, jiraAdapter, getSystemPrompt()),
    qualityCheckerService: new QualityCheckerService(jiraAdapter, llmAdapter),
    estimatorService: new EstimatorService(jiraAdapter, llmAdapter, githubAdapter),
    refinerService: new RefinerService(jiraAdapter, llmAdapter, githubAdapter),
  };
}

// Create CLI program
const program = new Command();

program
  .name("ai-ticket-agent")
  .description("CLI para consultar tickets de Jira usando lenguaje natural")
  .version("1.0.0");

// Register configuration commands (no dependencies required)
program.addCommand(createInitCommand());
program.addCommand(createConfigCommand());

// Search command with lazy initialization
program
  .command("search")
  .description("Buscar tickets en Jira usando lenguaje natural")
  .argument("<query>", "Consulta en lenguaje natural")
  .option("-l, --limit <number>", "Número máximo de resultados", "20")
  .option("-v, --verbose", "Mostrar información detallada de la búsqueda")
  .option("--jql", "Mostrar la query JQL generada")
  .action(async (query: string, options: { limit: string; verbose?: boolean; jql?: boolean }) => {
    try {
      const { searchService } = await initializeServices();
      const limit = parseInt(options.limit, 10);

      if (options.verbose) {
        console.log("\n🔍 Procesando consulta:", query);
        console.log("───────────────────────────────────────");
        console.log("\n⏳ Conectando con el LLM...");
        console.log("🤖 Interpretando consulta con LLM...");
      }

      const result = await searchService.execute(query, limit);

      if (options.verbose) {
        console.log("\n📋 Parámetros extraídos:");
        console.log(`   JQL: ${result.jql}`);
        console.log("\n⏳ Consultando Jira...");
      }

      displaySearchResult(result, options.jql ?? false, options.verbose ?? false);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`\n❌ Error: ${error.message}`);
      } else {
        console.error("\n❌ Error desconocido:", error);
      }
      process.exit(1);
    }
  });

// Check command with lazy initialization
program
  .command("check")
  .description("Evalúa la calidad de un ticket de Jira")
  .argument("<ticketKey>", "Clave del ticket (ej: TRD-123)")
  .option("-v, --verbose", "Mostrar información detallada")
  .action(async (ticketKey: string, options: { verbose?: boolean }) => {
    try {
      const { qualityCheckerService } = await initializeServices();

      if (options.verbose) {
        console.log(`\n🔍 Analizando ticket ${ticketKey}...`);
        console.log("───────────────────────────────────────");
      }

      const report = await qualityCheckerService.execute(ticketKey);
      displayQualityReport(report, options.verbose ?? false);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`\n❌ Error: ${error.message}`);
      } else {
        console.error("\n❌ Error desconocido:", error);
      }
      process.exit(1);
    }
  });

// Estimate command with lazy initialization
program
  .command("estimate")
  .description("Estima el esfuerzo de un ticket en puntos Fibonacci")
  .argument("<ticketKey>", "Clave del ticket (ej: TRD-123)")
  .option("-v, --verbose", "Mostrar información detallada")
  .action(async (ticketKey: string, options: { verbose?: boolean }) => {
    try {
      const { estimatorService } = await initializeServices();

      if (options.verbose) {
        console.log(`\n📊 Estimando ticket ${ticketKey}...`);
        console.log("───────────────────────────────────────");
      }

      const estimation = await estimatorService.execute(ticketKey);
      displayEstimationResult(estimation);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`\n❌ Error: ${error.message}`);
      } else {
        console.error("\n❌ Error desconocido:", error);
      }
      process.exit(1);
    }
  });

// Refine command with lazy initialization
program
  .command("refine")
  .description("Genera sugerencias de mejora para un ticket")
  .argument("<ticketKey>", "Clave del ticket (ej: TRD-123)")
  .option("-v, --verbose", "Mostrar información detallada")
  .action(async (ticketKey: string, options: { verbose?: boolean }) => {
    try {
      const { refinerService } = await initializeServices();

      if (options.verbose) {
        console.log(`\n✨ Refinando ticket ${ticketKey}...`);
        console.log("───────────────────────────────────────");
      }

      const refinement = await refinerService.execute(ticketKey);
      displayRefinementResult(refinement);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`\n❌ Error: ${error.message}`);
      } else {
        console.error("\n❌ Error desconocido:", error);
      }
      process.exit(1);
    }
  });

// Parse arguments
program.parse();
