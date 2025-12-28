import { type Dictionary } from "../../models/dictionary.js";

/**
 * Port for providing Jira dictionary data (projects, issue types, statuses, components).
 */
export interface DictionaryProviderPort {
  /**
   * Load the dictionary from the configured source.
   * @returns The loaded dictionary
   */
  load(): Dictionary;

  /**
   * Get the dictionary formatted as context for LLM prompts.
   * @returns Formatted context string
   */
  asContext(): string;
}

