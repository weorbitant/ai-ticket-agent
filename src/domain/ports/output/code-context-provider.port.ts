/**
 * Summary of a loaded file for debugging/verbose output.
 */
export interface LoadedFileSummary {
  owner: string;
  repo: string;
  path: string;
  category: "code" | "docs";
}

/**
 * Result of loading code context including metadata for verbose output.
 */
export interface CodeContextResult {
  /** Formatted context string to pass to the LLM */
  content: string;
  /** Summary of loaded files for debugging */
  loadedFiles: LoadedFileSummary[];
}

/**
 * Port for providing code context from external repositories.
 */
export interface CodeContextProviderPort {
  /**
   * Get formatted context from configured code repositories.
   * @param sourcesPath - Optional path to the sources configuration file
   * @returns Context content and metadata about loaded files
   */
  getContext(sourcesPath?: string): Promise<CodeContextResult>;
}

