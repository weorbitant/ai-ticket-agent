/**
 * Result of refining a ticket with additional context and structure.
 */
export interface RefinementResult {
  /** Suggested improved title, or null to keep the current one */
  suggestedTitle: string | null;
  /** Context explaining the problem or need */
  context: string;
  /** List of technical tasks involved */
  tasks: string[];
  /** List of acceptance criteria */
  acceptanceCriteria: string[];
  /** Additional relevant notes */
  additionalNotes: string | null;
  /** Warnings about fields that couldn't be completed */
  warnings: string[];
  /** Whether the refinement is complete (no warnings) */
  isComplete: boolean;
}

/**
 * Creates a default/empty refinement result.
 */
export function createEmptyRefinement(): RefinementResult {
  return {
    suggestedTitle: null,
    context: "",
    tasks: [],
    acceptanceCriteria: [],
    additionalNotes: null,
    warnings: ["No se pudo generar el refinamiento"],
    isComplete: false,
  };
}

