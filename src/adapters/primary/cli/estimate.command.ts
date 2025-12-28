import { Command } from "commander";
import { type EstimateEffortPort } from "../../../domain/ports/input/estimate-effort.port.js";
import { displayEstimationResult } from "./formatters.js";

export interface EstimateCommandOptions {
  verbose: boolean;
  sources?: string;
}

/**
 * Creates the estimate command.
 */
export function createEstimateCommand(estimatorService: EstimateEffortPort): Command {
  return new Command("estimate")
    .description("Estimar esfuerzo de un ticket usando contexto de repositorios GitHub")
    .argument("<ticket-key>", "Clave del ticket (ej: TRD-123)")
    .option("-v, --verbose", "Mostrar información detallada")
    .option("--sources <path>", "Ruta al archivo github-sources.json")
    .action(async (ticketKey: string, options: EstimateCommandOptions) => {
      try {
        console.log(`\n🎯 Estimando ticket ${ticketKey}...`);
        console.log("───────────────────────────────────────");

        if (options.verbose) {
          console.log("\n⏳ Obteniendo ticket de Jira...");
          console.log("\n⏳ Cargando contexto de repositorios GitHub...");
          console.log("\n⏳ Analizando complejidad con LLM...");
        }

        const result = await estimatorService.execute(ticketKey, options.sources);
        displayEstimationResult(result);
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

