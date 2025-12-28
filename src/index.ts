// Domain models
export * from "./domain/models/index.js";

// Domain ports - Input (use cases)
export * from "./domain/ports/input/index.js";

// Domain ports - Output
export * from "./domain/ports/output/index.js";

// Domain services
export {
  SearchService,
  QualityCheckerService,
  EstimatorService,
  buildJql,
  type JqlBuilderResult,
} from "./domain/services/index.js";

// Adapters - Secondary
export { JiraAdapter, type JiraAdapterOptions } from "./adapters/secondary/jira/jira.adapter.js";
export {
  LangChainAdapter,
  type LangChainAdapterOptions,
} from "./adapters/secondary/llm/langchain.adapter.js";
export { GitHubAdapter } from "./adapters/secondary/github/github.adapter.js";
export { JsonDictionaryAdapter } from "./adapters/secondary/filesystem/json-dictionary.adapter.js";

// Adapter types (for consumers who need Jira-specific types)
export {
  type JiraIssue,
  type JiraSearchResponse,
  toTicket,
} from "./adapters/secondary/jira/types.js";
export {
  type GitHubSource,
  type GitHubSources,
  type GitHubClientOptions,
  type LoadedFile,
} from "./adapters/secondary/github/types.js";

// LLM prompts (for customization)
export { getSystemPrompt } from "./adapters/secondary/llm/prompts.js";

// Config
export { appConfig, type Config } from "./config/index.js";
