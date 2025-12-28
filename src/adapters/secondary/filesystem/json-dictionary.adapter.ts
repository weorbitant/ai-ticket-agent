import { readFileSync } from "fs";
import { resolve } from "path";
import {
  type Dictionary,
  dictionarySchema,
  formatDictionaryAsContext,
} from "../../../domain/models/dictionary.js";
import { type DictionaryProviderPort } from "../../../domain/ports/output/dictionary-provider.port.js";

export interface JsonDictionaryAdapterOptions {
  dictionaryPath?: string;
}

/**
 * JSON file adapter implementing DictionaryProviderPort.
 */
export class JsonDictionaryAdapter implements DictionaryProviderPort {
  private cachedDictionary: Dictionary | null = null;
  private readonly dictionaryPath: string;

  constructor(options: JsonDictionaryAdapterOptions = {}) {
    this.dictionaryPath =
      options.dictionaryPath ?? resolve(process.cwd(), "data", "dictionary.json");
  }

  load(): Dictionary {
    if (this.cachedDictionary) {
      return this.cachedDictionary;
    }

    try {
      const content = readFileSync(this.dictionaryPath, "utf-8");
      const parsed = JSON.parse(content);
      const result = dictionarySchema.safeParse(parsed);

      if (!result.success) {
        const errors = result.error.errors
          .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
          .join("\n");
        throw new Error(`Error en el diccionario:\n${errors}`);
      }

      this.cachedDictionary = result.data;
      return this.cachedDictionary;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`El archivo dictionary.json no es un JSON válido: ${error.message}`);
      }
      throw error;
    }
  }

  asContext(): string {
    const dictionary = this.load();
    return formatDictionaryAsContext(dictionary);
  }

  /**
   * Clears the cached dictionary.
   */
  clearCache(): void {
    this.cachedDictionary = null;
  }
}

