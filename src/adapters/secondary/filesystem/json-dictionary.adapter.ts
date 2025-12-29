import { readFileSync } from "fs";
import {
  type Dictionary,
  dictionarySchema,
  formatDictionaryAsContext,
} from "../../../domain/models/dictionary.js";
import { type DictionaryProviderPort } from "../../../domain/ports/output/dictionary-provider.port.js";
import { resolveConfigFile, getUserConfigPath } from "../../../config/paths.js";

export interface JsonDictionaryAdapterOptions {
  dictionaryPath?: string;
}

/**
 * JSON file adapter implementing DictionaryProviderPort.
 * Loads dictionary from user config (~/.ai-ticket-agent/) or local data/ directory.
 */
export class JsonDictionaryAdapter implements DictionaryProviderPort {
  private cachedDictionary: Dictionary | null = null;
  private readonly dictionaryPath: string | null;

  constructor(options: JsonDictionaryAdapterOptions = {}) {
    this.dictionaryPath = options.dictionaryPath ?? resolveConfigFile("dictionary.json");
  }

  load(): Dictionary {
    if (this.cachedDictionary) {
      return this.cachedDictionary;
    }

    if (!this.dictionaryPath) {
      const userPath = getUserConfigPath("dictionary.json");
      throw new Error(
        `No se encontró dictionary.json.\n\n` +
          `Crea el archivo en: ${userPath}\n\n` +
          `Puedes inicializar la configuración ejecutando:\n` +
          `  npx ai-ticket-agent init\n\n` +
          `O crea manualmente el archivo con la estructura:\n` +
          `{\n` +
          `  "projects": [],\n` +
          `  "issueTypes": [],\n` +
          `  "statuses": [],\n` +
          `  "components": []\n` +
          `}`
      );
    }

    try {
      const content = readFileSync(this.dictionaryPath, "utf-8");
      const parsed = JSON.parse(content);
      const result = dictionarySchema.safeParse(parsed);

      if (!result.success) {
        const errors = result.error.errors
          .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
          .join("\n");
        throw new Error(`Error en el diccionario (${this.dictionaryPath}):\n${errors}`);
      }

      this.cachedDictionary = result.data;
      return this.cachedDictionary;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(
          `El archivo dictionary.json no es un JSON válido: ${error.message}\n` +
            `Archivo: ${this.dictionaryPath}`
        );
      }
      throw error;
    }
  }

  asContext(): string {
    const dictionary = this.load();
    return formatDictionaryAsContext(dictionary);
  }

  /**
   * Returns the path from which the dictionary is loaded.
   */
  getLoadedPath(): string | null {
    return this.dictionaryPath;
  }

  /**
   * Clears the cached dictionary.
   */
  clearCache(): void {
    this.cachedDictionary = null;
  }
}
