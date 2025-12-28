import { z } from "zod";
import { type Ticket } from "../../../domain/models/ticket.js";

// Jira Issue schema (simplified for MVP)
export const jiraIssueSchema = z.object({
  id: z.string(),
  key: z.string(),
  self: z.string(),
  fields: z.object({
    summary: z.string(),
    status: z.object({
      name: z.string(),
      id: z.string().optional(),
    }),
    issuetype: z.object({
      name: z.string(),
      id: z.string().optional(),
    }),
    priority: z
      .object({
        name: z.string(),
        id: z.string().optional(),
      })
      .optional()
      .nullable(),
    assignee: z
      .object({
        displayName: z.string(),
        emailAddress: z.string().optional(),
      })
      .optional()
      .nullable(),
    reporter: z
      .object({
        displayName: z.string(),
        emailAddress: z.string().optional(),
      })
      .optional()
      .nullable(),
    created: z.string(),
    updated: z.string(),
    components: z
      .array(
        z.object({
          name: z.string(),
          id: z.string().optional(),
        })
      )
      .optional()
      .default([]),
    labels: z.array(z.string()).optional().default([]),
    description: z.unknown().optional().nullable(), // Can be string or ADF
    customfield_10031: z.number().optional().nullable(), // Story Points
  }),
});

export type JiraIssue = z.infer<typeof jiraIssueSchema>;

// Jira Search Response schema (API v3 /search/jql returns different structure)
export const jiraSearchResponseSchema = z.object({
  expand: z.string().optional(),
  startAt: z.number().optional(),
  maxResults: z.number().optional(),
  total: z.number().optional(),
  isLast: z.boolean().optional(),
  issues: z.array(jiraIssueSchema),
});

export type JiraSearchResponse = z.infer<typeof jiraSearchResponseSchema>;

/**
 * Converts a Jira API issue to a domain Ticket.
 */
export function toTicket(issue: JiraIssue): Ticket {
  return {
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status.name,
    type: issue.fields.issuetype.name,
    priority: issue.fields.priority?.name ?? null,
    assignee: issue.fields.assignee?.displayName ?? null,
    components: issue.fields.components.map((c) => c.name),
    created: issue.fields.created,
    updated: issue.fields.updated,
    storyPoints: issue.fields.customfield_10031 ?? null,
    description: issue.fields.description,
  };
}

