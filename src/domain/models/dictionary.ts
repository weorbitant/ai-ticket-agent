import { z } from "zod";

/**
 * Schema for a Jira project definition.
 */
export const projectSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
  aliases: z.array(z.string()),
});

export type Project = z.infer<typeof projectSchema>;

/**
 * Schema for a Jira issue type definition.
 */
export const issueTypeSchema = z.object({
  name: z.string(),
  aliases: z.array(z.string()),
});

export type IssueType = z.infer<typeof issueTypeSchema>;

/**
 * Schema for a Jira status definition.
 */
export const statusSchema = z.object({
  name: z.string(),
  aliases: z.array(z.string()),
});

export type Status = z.infer<typeof statusSchema>;

/**
 * Schema for a Jira component definition.
 */
export const componentSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  aliases: z.array(z.string()),
});

export type Component = z.infer<typeof componentSchema>;

/**
 * Schema for the complete Jira dictionary.
 */
export const dictionarySchema = z.object({
  projects: z.array(projectSchema),
  issueTypes: z.array(issueTypeSchema),
  statuses: z.array(statusSchema),
  components: z.array(componentSchema),
});

export type Dictionary = z.infer<typeof dictionarySchema>;

/**
 * Formats a dictionary as context string for LLM prompts.
 */
export function formatDictionaryAsContext(dictionary: Dictionary): string {
  const projectsList = dictionary.projects
    .map((p) => `- ${p.key}: ${p.name}${p.description ? ` (${p.description})` : ""}`)
    .join("\n");

  const issueTypesList = dictionary.issueTypes.map((t) => `- ${t.name}`).join("\n");

  const statusesList = dictionary.statuses.map((s) => `- ${s.name}`).join("\n");

  const componentsList = dictionary.components
    .map((c) => `- ${c.name}${c.description ? `: ${c.description}` : ""}`)
    .join("\n");

  return `## Proyectos disponibles:
${projectsList}

## Tipos de issue:
${issueTypesList}

## Estados:
${statusesList}

## Componentes:
${componentsList}`;
}

