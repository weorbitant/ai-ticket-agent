/**
 * Port for providing code context from external repositories.
 */
export interface CodeContextProviderPort {
  /**
   * Get formatted context from configured code repositories.
   * @param sourcesPath - Optional path to the sources configuration file
   * @returns Formatted string with repository documentation
   */
  getContext(sourcesPath?: string): Promise<string>;
}

