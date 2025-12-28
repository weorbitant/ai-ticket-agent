#!/usr/bin/env node

import { Command } from "commander";
import { appConfig } from "../../../config/index.js";

// Services
import { SearchService } from "../../../domain/services/search.service.js";
import { QualityCheckerService } from "../../../domain/services/quality-checker.service.js";
import { EstimatorService } from "../../../domain/services/estimator.service.js";

// Adapters
import { JiraAdapter } from "../../secondary/jira/jira.adapter.js";
import { LangChainAdapter } from "../../secondary/llm/langchain.adapter.js";
import { GitHubAdapter } from "../../secondary/github/github.adapter.js";
import { getSystemPrompt } from "../../secondary/llm/prompts.js";

// Commands
import { createSearchCommand } from "./search.command.js";
import { createCheckCommand } from "./check.command.js";
import { createEstimateCommand } from "./estimate.command.js";

// Initialize adapters
const jiraAdapter = new JiraAdapter({
  baseUrl: appConfig.jira.baseUrl,
  email: appConfig.jira.email,
  apiToken: appConfig.jira.apiToken,
});

const llmAdapter = new LangChainAdapter({
  baseUrl: appConfig.llama.baseUrl,
});

const githubAdapter = new GitHubAdapter({
  token: appConfig.github?.token,
});

// Initialize services with dependency injection
const searchService = new SearchService(llmAdapter, jiraAdapter, getSystemPrompt());
const qualityCheckerService = new QualityCheckerService(jiraAdapter, llmAdapter);
const estimatorService = new EstimatorService(jiraAdapter, llmAdapter, githubAdapter);

// Create CLI program
const program = new Command();

program
  .name("ia-ticket-agent")
  .description("CLI para consultar tickets de Jira usando lenguaje natural")
  .version("1.0.0");

// Register commands
program.addCommand(createSearchCommand(searchService));
program.addCommand(createCheckCommand(qualityCheckerService));
program.addCommand(createEstimateCommand(estimatorService));

// Parse arguments
program.parse();

