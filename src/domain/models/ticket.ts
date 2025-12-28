import { z } from "zod";

/**
 * Schema helper that transforms strings "null" or empty strings to actual null values.
 * This is needed because LLMs sometimes return the string "null" instead of the JSON null value.
 */
const nullableString = z
  .string()
  .nullable()
  .transform((val) => {
    if (val === null || val === "" || val === "null") {
      return null;
    }
    return val;
  });

/**
 * Schema for search parameters extracted from user queries.
 */
export const searchParamsSchema = z.object({
  project: nullableString,
  issueType: nullableString,
  status: nullableString,
  component: nullableString,
  textSearch: nullableString,
});

export type SearchParams = z.infer<typeof searchParamsSchema>;

/**
 * Validates raw data against the SearchParams schema.
 */
export function validateSearchParams(data: unknown): SearchParams {
  const result = searchParamsSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(`Respuesta del LLM no válida:\n${errors}`);
  }

  return result.data;
}

/**
 * Domain entity representing a ticket for display purposes.
 */
export interface Ticket {
  key: string;
  summary: string;
  status: string;
  type: string;
  priority: string | null;
  assignee: string | null;
  components: string[];
  created: string;
  updated: string;
  storyPoints: number | null;
  description: unknown;
}

/**
 * Result of a search operation.
 */
export interface SearchResult {
  tickets: Ticket[];
  jql: string;
  explanation: string[];
}

/**
 * Quality report for a ticket, containing all quality check results.
 */
export interface QualityReport {
  ticket: Ticket;
  hasComponent: boolean;
  hasStoryPoints: boolean;
  descriptionEvaluation: {
    isAdequate: boolean;
    feedback: string;
  };
  titleEvaluation: {
    isAdequate: boolean;
    feedback: string;
  };
  passedChecks: number;
  totalChecks: number;
}

