import { Command } from "commander";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { getConfigDir, getUserConfigPath } from "../../../config/paths.js";

/**
 * Default dictionary template with common Jira issue types and statuses.
 */
const DEFAULT_DICTIONARY = {
  projects: [],
  issueTypes: [
    { name: "Bug", aliases: ["bug", "bugs", "error", "errores", "fallo", "fallos"] },
    { name: "Story", aliases: ["historia", "historias", "story", "stories", "funcionalidad"] },
    { name: "Task", aliases: ["tarea", "tareas", "task", "tasks"] },
    { name: "Epic", aliases: ["epic", "epica", "epicas", "epics"] },
    { name: "Sub-task", aliases: ["subtarea", "subtareas", "sub-task", "sub-tasks"] },
  ],
  statuses: [
    { name: "Open", aliases: ["abierto", "abierta", "open", "nuevo"] },
    { name: "In Progress", aliases: ["en progreso", "in progress", "desarrollo"] },
    { name: "Done", aliases: ["cerrado", "done", "completado", "resuelto", "finalizado"] },
    { name: "To Do", aliases: ["pendiente", "to do", "todo", "por hacer"] },
  ],
  components: [],
};

/**
 * Default GitHub sources template (empty).
 */
const DEFAULT_GITHUB_SOURCES = {
  sources: [],
};

/**
 * Creates a file with the given content, respecting the force flag.
 * Returns true if the file was created, false if it already existed.
 */
function createConfigFile(
  filePath: string,
  content: object,
  force: boolean,
  verbose: boolean
): boolean {
  if (existsSync(filePath) && !force) {
    if (verbose) {
      console.log(`  - Ya existe: ${filePath}`);
    }
    return false;
  }

  writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n");
  console.log(`  ✓ Creado: ${filePath}`);
  return true;
}

/**
 * Creates the init command for initializing user configuration.
 */
export function createInitCommand(): Command {
  return new Command("init")
    .description("Inicializa la configuración del usuario en ~/.ai-ticket-agent/")
    .option("-f, --force", "Sobrescribir archivos existentes")
    .option("-v, --verbose", "Mostrar información detallada")
    .action((options: { force?: boolean; verbose?: boolean }) => {
      const configDir = getConfigDir();
      const force = options.force ?? false;
      const verbose = options.verbose ?? false;

      console.log("\n🔧 Inicializando configuración de ai-ticket-agent\n");

      // Create config directory if it doesn't exist
      if (!existsSync(configDir)) {
        mkdirSync(configDir, { recursive: true });
        console.log(`  ✓ Directorio creado: ${configDir}\n`);
      } else if (verbose) {
        console.log(`  - Directorio existente: ${configDir}\n`);
      }

      // Create configuration files
      console.log("Archivos de configuración:");

      const dictPath = getUserConfigPath("dictionary.json");
      const dictCreated = createConfigFile(dictPath, DEFAULT_DICTIONARY, force, verbose);

      const githubPath = getUserConfigPath("github-sources.json");
      const githubCreated = createConfigFile(githubPath, DEFAULT_GITHUB_SOURCES, force, verbose);

      // Summary and next steps
      console.log("\n" + "─".repeat(60));
      console.log(`\n📁 Directorio de configuración: ${configDir}\n`);

      if (dictCreated || githubCreated) {
        console.log("Próximos pasos:");
        console.log("");
        if (dictCreated) {
          console.log("  1. Edita dictionary.json para añadir tus proyectos y componentes Jira:");
          console.log(`     ${dictPath}`);
          console.log("");
        }
        if (githubCreated) {
          console.log(
            `  ${dictCreated ? "2" : "1"}. (Opcional) Configura github-sources.json para contexto de código:`
          );
          console.log(`     ${githubPath}`);
          console.log("");
        }
        console.log("  Para más información, consulta la documentación del proyecto.");
      } else {
        console.log("No se crearon archivos nuevos.");
        if (!force) {
          console.log("Usa --force para sobrescribir los archivos existentes.");
        }
      }

      console.log("");
    });
}

