import { z } from "zod";

// Schema for GitHub API response when fetching file contents
export const gitHubFileContentSchema = z.object({
  name: z.string(),
  path: z.string(),
  sha: z.string(),
  size: z.number(),
  type: z.literal("file"),
  content: z.string(), // Base64 encoded content
  encoding: z.literal("base64"),
});

export type GitHubFileContent = z.infer<typeof gitHubFileContentSchema>;

// Category types for GitHub sources
export const gitHubSourceCategorySchema = z.enum(["code", "docs"]);
export type GitHubSourceCategory = z.infer<typeof gitHubSourceCategorySchema>;

// Schema for a source definition in github-sources.json
export const gitHubSourceSchema = z.object({
  owner: z.string().min(1, "owner es requerido"),
  repo: z.string().min(1, "repo es requerido"),
  files: z.array(z.string()).min(1, "al menos un archivo es requerido"),
  ref: z.string().optional().default("main"),
  category: gitHubSourceCategorySchema.default("code"),
});

export type GitHubSource = z.infer<typeof gitHubSourceSchema>;

// Schema for the full github-sources.json file
export const gitHubSourcesSchema = z.object({
  sources: z.array(gitHubSourceSchema),
});

export type GitHubSources = z.infer<typeof gitHubSourcesSchema>;

// Represents a loaded file with its content
export interface LoadedFile {
  owner: string;
  repo: string;
  path: string;
  ref: string;
  content: string;
  category: GitHubSourceCategory;
}

// Client options
export interface GitHubClientOptions {
  token?: string;
  baseUrl?: string;
}

