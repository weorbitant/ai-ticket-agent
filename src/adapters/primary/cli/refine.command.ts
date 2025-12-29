import { Command } from "commander";
import { type RefineTicketPort } from "../../../domain/ports/input/refine-ticket.port.js";
import { displayRefinementResult } from "./formatters.js";

export interface RefineCommandOptions {
  verbose: boolean;
  sources?: string;
}

/**
 * Creates the refine command.
 */
export function createRefineCommand(refinerService: RefineTicketPort): Command {
  return new Command("refine")
    .description("Refinar un ticket añadiendo contexto, tareas y criterios de aceptación")
    .argument("<ticket-key>", "Clave del ticket (ej: TRD-123)")
    .argument("[context]", "Contexto adicional para el refinamiento")
    .option("-v, --verbose", "Mostrar información detallada")
    .option("--sources <path>", "Ruta al archivo github-sources.json")
    .action(async (ticketKey: string, userContext: string | undefined, options: RefineCommandOptions) => {
      try {
        console.log(`\n✨ Refinando ticket ${ticketKey}...`);
        console.log("───────────────────────────────────────");

        if (userContext && options.verbose) {
          console.log(`\n💬 Contexto del usuario: "${userContext}"`);
        }

        const result = await refinerService.execute(ticketKey, {
          sourcesPath: options.sources,
          userContext,
        });

        if (options.verbose) {
          displayVerboseContext(result.loadedFiles);
        }

        displayRefinementResult(result);
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

/**
 * Displays verbose information about loaded GitHub context.
 */
function displayVerboseContext(
  loadedFiles: Array<{ owner: string; repo: string; path: string; category: "code" | "docs" }>
): void {
  console.log("\n📂 Contexto de GitHub cargado:");
  console.log("───────────────────────────────────────");

  if (loadedFiles.length === 0) {
    console.log("  (ningún archivo cargado)");
    return;
  }

  const codeFiles = loadedFiles.filter((f) => f.category === "code");
  const docsFiles = loadedFiles.filter((f) => f.category === "docs");

  if (codeFiles.length > 0) {
    console.log("\n  📦 Contexto de Código:");
    for (const file of codeFiles) {
      console.log(`     • ${file.owner}/${file.repo}/${file.path}`);
    }
  }

  if (docsFiles.length > 0) {
    console.log("\n  📄 Documentación de Arquitectura:");
    for (const file of docsFiles) {
      console.log(`     • ${file.owner}/${file.repo}/${file.path}`);
    }
  }

  console.log("");
}

