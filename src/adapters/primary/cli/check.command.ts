import { Command } from "commander";
import { type CheckTicketQualityPort } from "../../../domain/ports/input/check-ticket-quality.port.js";
import { displayQualityReport } from "./formatters.js";

export interface CheckCommandOptions {
  verbose: boolean;
}

/**
 * Creates the check command.
 */
export function createCheckCommand(qualityCheckerService: CheckTicketQualityPort): Command {
  return new Command("check")
    .description("Analizar un ticket de Jira y evaluar criterios de calidad")
    .argument("<ticket-key>", "Clave del ticket (ej: TRD-123)")
    .option("-v, --verbose", "Mostrar información detallada")
    .action(async (ticketKey: string, options: CheckCommandOptions) => {
      try {
        console.log(`\n🔍 Analizando ticket ${ticketKey}...`);
        console.log("───────────────────────────────────────");

        if (options.verbose) {
          console.log("\n⏳ Obteniendo ticket de Jira...");
          console.log("\n⏳ Evaluando descripción con LLM...");
          console.log("\n⏳ Evaluando título con LLM...");
        }

        const report = await qualityCheckerService.execute(ticketKey);
        displayQualityReport(report, options.verbose);
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

