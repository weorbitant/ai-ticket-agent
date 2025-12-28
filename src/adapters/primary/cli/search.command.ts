import { Command } from "commander";
import { type SearchTicketsPort } from "../../../domain/ports/input/search-tickets.port.js";
import { displaySearchResult } from "./formatters.js";

export interface SearchCommandOptions {
  limit: string;
  verbose: boolean;
  jql: boolean;
}

/**
 * Creates the search command.
 */
export function createSearchCommand(searchService: SearchTicketsPort): Command {
  return new Command("search")
    .description("Buscar tickets en Jira usando lenguaje natural")
    .argument("<query>", "Consulta en lenguaje natural")
    .option("-l, --limit <number>", "Número máximo de resultados", "20")
    .option("-v, --verbose", "Mostrar información detallada de la búsqueda")
    .option("--jql", "Mostrar la query JQL generada")
    .action(async (query: string, options: SearchCommandOptions) => {
      try {
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

        displaySearchResult(result, options.jql, options.verbose);
      } catch (error) {
        if (error instanceof Error) {
          console.error(`\n❌ Error: ${error.message}`);
        } else {
          console.error("\n❌ Error desconocido:", error);
        }
        process.exit(1);
      }
    });
}

