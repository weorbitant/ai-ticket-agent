import { Command } from "commander";
import {
  getConfigDir,
  getConfigFileInfo,
  configDirExists,
} from "../../../config/paths.js";

const SEPARATOR = "────────────────────────────────────────────────────────────";

/**
 * Formats a source label with color-like indicators.
 */
function formatSource(source: "user" | "local" | "none"): string {
  switch (source) {
    case "user":
      return "✓ usuario";
    case "local":
      return "○ local";
    case "none":
      return "✗ no encontrado";
  }
}

/**
 * Creates the config command for displaying configuration information.
 */
export function createConfigCommand(): Command {
  const configCmd = new Command("config").description(
    "Muestra información sobre la configuración"
  );

  // Subcommand: config path
  configCmd
    .command("path")
    .description("Muestra la ruta del directorio de configuración")
    .action(() => {
      const configDir = getConfigDir();
      const exists = configDirExists();

      console.log(configDir);

      if (!exists) {
        console.error("\n(El directorio no existe. Ejecuta 'init' para crearlo.)");
        process.exitCode = 1;
      }
    });

  // Subcommand: config show
  configCmd
    .command("show")
    .description("Muestra la configuración actual y de dónde se carga cada archivo")
    .action(() => {
      const configDir = getConfigDir();
      const exists = configDirExists();

      console.log("\n📁 Configuración de ai-ticket-agent\n");
      console.log(SEPARATOR);

      // Config directory
      console.log(`\nDirectorio de usuario: ${configDir}`);
      console.log(`Estado: ${exists ? "✓ existe" : "✗ no existe"}`);

      // Dictionary file
      console.log(`\n${SEPARATOR}`);
      console.log("\n📄 dictionary.json");
      const dictInfo = getConfigFileInfo("dictionary.json");
      console.log(`   Origen: ${formatSource(dictInfo.source)}`);
      console.log(`   Ruta usuario: ${dictInfo.userPath}`);
      console.log(`   Ruta local:   ${dictInfo.localPath}`);
      if (dictInfo.resolvedPath) {
        console.log(`   Cargado de:   ${dictInfo.resolvedPath}`);
      }

      // GitHub sources file
      console.log(`\n${SEPARATOR}`);
      console.log("\n📄 github-sources.json");
      const githubInfo = getConfigFileInfo("github-sources.json");
      console.log(`   Origen: ${formatSource(githubInfo.source)}`);
      console.log(`   Ruta usuario: ${githubInfo.userPath}`);
      console.log(`   Ruta local:   ${githubInfo.localPath}`);
      if (githubInfo.resolvedPath) {
        console.log(`   Cargado de:   ${githubInfo.resolvedPath}`);
      } else {
        console.log(`   (Opcional, no configurado)`);
      }

      console.log(`\n${SEPARATOR}`);

      // Help message
      if (!exists) {
        console.log("\n💡 Ejecuta 'init' para crear el directorio de configuración.");
      }

      console.log("");
    });

  return configCmd;
}

