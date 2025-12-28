# AGENTS.md - AI Ticket Agent

This document provides context for AI agents working with this codebase.

## Project Description

CLI to manage Jira tickets using natural language, powered by a local LLM (llama.cpp) as interpreter.

**Fundamental principle**: The LLM acts exclusively as a natural language interpreter. It never executes actions directly against Jira or GitHub. It only transforms queries into structured parameters.

### Features

| Command | Description |
|---------|-------------|
| `search` | Search tickets with natural language (translates to JQL) |
| `check` | Evaluate ticket quality (component, story points, description, title) |
| `estimate` | Estimate effort in Fibonacci points using GitHub repository context |

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | >= 22 | Runtime |
| TypeScript | 5.7 | Main language |
| ESM | - | Module system (type: "module") |
| LangChain | @langchain/openai | LLM integration via OpenAI-compatible API |
| Zod | 3.x | Schema validation and types |
| Axios | 1.x | HTTP client for Jira and GitHub |
| Commander | 12.x | CLI framework |
| Jest | 30.x | Testing with ts-jest for ESM |
| ESLint | 9.x | Linting with flat config |
| Prettier | 3.x | Code formatting |

## Hexagonal Architecture (Ports & Adapters)

The project follows the **Hexagonal Architecture** pattern to decouple business logic from infrastructure details.

### Principles

1. **Domain is the center**: Business logic does not depend on frameworks, databases, or external APIs.
2. **Dependencies point inward**: Adapters depend on ports, never the reverse.
3. **Ports as contracts**: Interfaces that define how the domain interacts with the outside world.
4. **Interchangeable adapters**: Concrete implementations that can be substituted without affecting the domain.

### Directory Structure

```
src/
├── domain/                    # Application core (no external dependencies)
│   ├── models/               # Entities and value objects
│   │   ├── ticket.ts         # Ticket, TicketQuality, SearchParams
│   │   ├── estimation.ts     # EstimationResult, FibonacciPoints
│   │   └── dictionary.ts     # Project, IssueType, Status, Component
│   ├── ports/                # Interfaces (contracts)
│   │   ├── input/            # Primary ports (use cases)
│   │   │   ├── search-tickets.port.ts
│   │   │   ├── check-ticket-quality.port.ts
│   │   │   └── estimate-effort.port.ts
│   │   └── output/           # Secondary ports (driven)
│   │       ├── ticket-repository.port.ts
│   │       ├── llm-interpreter.port.ts
│   │       ├── code-context-provider.port.ts
│   │       └── dictionary-provider.port.ts
│   └── services/             # Business logic (implements input ports)
│       ├── search.service.ts
│       ├── quality-checker.service.ts
│       └── estimator.service.ts
│
├── adapters/                  # Port implementations
│   ├── primary/              # Input adapters (driving)
│   │   └── cli/              # Commander CLI
│   │       ├── index.ts
│   │       ├── search.command.ts
│   │       ├── check.command.ts
│   │       └── estimate.command.ts
│   └── secondary/            # Output adapters (driven)
│       ├── jira/             # Implements TicketRepositoryPort
│       │   ├── jira.adapter.ts
│       │   ├── jql-builder.ts
│       │   └── types.ts
│       ├── llm/              # Implements LLMInterpreterPort
│       │   ├── langchain.adapter.ts
│       │   └── prompts.ts
│       ├── github/           # Implements CodeContextProviderPort
│       │   ├── github.adapter.ts
│       │   └── types.ts
│       └── filesystem/       # Implements DictionaryProviderPort
│           └── json-dictionary.adapter.ts
│
├── config/                    # Application configuration
│   └── index.ts
│
└── index.ts                   # Composition and exports
```

### Ports (Interfaces)

**Input Ports (Use Cases)**
```typescript
// Each port defines a domain use case
interface SearchTicketsPort {
  execute(query: string): Promise<Ticket[]>;
}

interface CheckTicketQualityPort {
  execute(ticketKey: string): Promise<QualityReport>;
}

interface EstimateEffortPort {
  execute(ticketKey: string): Promise<EstimationResult>;
}
```

**Output Ports (Driven)**
```typescript
// Contracts that the domain needs from the outside
interface TicketRepositoryPort {
  search(jql: string, limit: number): Promise<Ticket[]>;
  getByKey(key: string): Promise<Ticket>;
}

interface LLMInterpreterPort {
  interpretQuery(context: string, query: string): Promise<SearchParams>;
  evaluateDescription(description: string): Promise<EvaluationResult>;
  evaluateTitle(title: string): Promise<EvaluationResult>;
  estimateEffort(ticket: Ticket, codeContext: string): Promise<EstimationResult>;
}

interface CodeContextProviderPort {
  getContext(): Promise<string>;
}

interface DictionaryProviderPort {
  load(): Dictionary;
  asContext(): string;
}
```

### Adapters

**Primary Adapters (Driving)**
- `CLI Adapter`: Uses Commander.js to expose use cases as terminal commands.

**Secondary Adapters (Driven)**
- `Jira Adapter`: Implements `TicketRepositoryPort` using Jira REST API v3.
- `LangChain Adapter`: Implements `LLMInterpreterPort` using LangChain with llama.cpp.
- `GitHub Adapter`: Implements `CodeContextProviderPort` using GitHub API.
- `JSON Dictionary Adapter`: Implements `DictionaryProviderPort` loading from `data/dictionary.json`.

### Flows with Hexagonal Architecture

**1. search** - Natural language search
```
CLI Adapter -> SearchTicketsPort -> SearchService
                                         |
                    +--------------------+--------------------+
                    |                                         |
                    v                                         v
         LLMInterpreterPort                          TicketRepositoryPort
                    |                                         |
                    v                                         v
         LangChain Adapter                              Jira Adapter
```

**2. check** - Quality evaluation
```
CLI Adapter -> CheckTicketQualityPort -> QualityCheckerService
                                               |
                          +-------------------+-------------------+
                          |                                       |
                          v                                       v
               TicketRepositoryPort                    LLMInterpreterPort
                          |                                       |
                          v                                       v
                    Jira Adapter                         LangChain Adapter
```

**3. estimate** - Effort estimation
```
CLI Adapter -> EstimateEffortPort -> EstimatorService
                                           |
                   +-----------------------+-----------------------+
                   |                       |                       |
                   v                       v                       v
        TicketRepositoryPort    CodeContextProviderPort    LLMInterpreterPort
                   |                       |                       |
                   v                       v                       v
             Jira Adapter           GitHub Adapter         LangChain Adapter
```

### Benefits of this Architecture

1. **Testability**: The domain can be tested with port mocks.
2. **Flexibility**: Switching from llama.cpp to OpenAI only requires a new adapter.
3. **Clarity**: Explicit separation between "what it does" (domain) and "how it does it" (adapters).
4. **Maintainability**: Changes to external APIs only affect their adapters.

### Current State vs Target

> **Note**: The current code does NOT follow this structure. This document defines the target architecture for a future refactor. During the transition:
> - New features should follow this pattern
> - Gradual refactors will move existing code to this structure
> - Tests should be prepared to mock ports

**Current structure (legacy)**:
```
src/
├── cli/           # Mixes primary adapter + orchestration
├── config/        # OK - stays as is
├── dictionary/    # Move to adapters/secondary/filesystem/
├── github/        # Move to adapters/secondary/github/
├── interpreter/   # Split into domain/services/ and domain/models/
├── jira/          # Move to adapters/secondary/jira/
└── llm/           # Move to adapters/secondary/llm/
```

## Code Conventions

### Hexagonal Architecture
- **Domain**: Pure classes and functions, no infrastructure dependencies
- **Ports**: Interfaces with `Port` suffix (e.g., `TicketRepositoryPort`)
- **Adapters**: Classes with `Adapter` suffix (e.g., `JiraAdapter`)
- **Services**: Implement use cases, receive ports via constructor (DI)

### General
- Small and focused files (< 150 lines ideally, ~350 max)
- Single responsibility per module
- Explicit exports in root `src/index.ts`
- Imports with `.js` extension (required by ESM)

### Types
- Infer types from Zod: `type X = z.infer<typeof xSchema>`
- Literal types for finite values: `type FibonacciPoints = 1 | 2 | 3 | 5 | 8 | 13`
- Interfaces for ports: `interface XPort { ... }`
- Interfaces for options objects: `interface XOptions { ... }`

### Validation
- All external input validated with Zod
- Configuration validated on load (fail early)
- API responses validated with schemas in adapters
- LLM responses parsed with regex and validated
- Domain receives already validated data

### Error Handling
- Descriptive error messages in Spanish for the user
- Domain errors vs infrastructure errors separated
- Distinguish connection errors vs validation errors
- Return default values when appropriate (e.g., estimation = 5 points)

## Testing

- Framework: Jest with ts-jest ESM preset
- Pattern: AAA (Arrange, Act, Assert)
- Location: Tests alongside code (`*.test.ts`)
- Coverage: Excludes `src/cli/` and `src/index.ts`

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

## Linting and Formatting

### ESLint (v9 flat config)
- Base: `@eslint/js` recommended + `typescript-eslint` recommended
- `@typescript-eslint/no-explicit-any`: warn
- Unused variables: error (except `_` prefix)

### TypeScript (strict mode)
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true,
  "noFallthroughCasesInSwitch": true
}
```

### Prettier
- Double quotes
- Semicolons required
- Print width: 100 (default)

```bash
npm run lint          # Check linting
npm run lint:fix      # Auto-fix
npm run format        # Format with Prettier
npm run format:check  # Check formatting
```

## Environment Variables

Create `.env` file based on `.env.example`:

```bash
# Jira Cloud (required)
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-api-token

# llama.cpp (required)
LLAMA_BASE_URL=http://localhost:8080

# GitHub (optional, for private repos)
GITHUB_TOKEN=ghp_xxxx
```

## Data Files

### `data/dictionary.json`
Jira terms dictionary. Structure:
```json
{
  "projects": [{ "key": "TRD", "name": "...", "aliases": [...] }],
  "issueTypes": [{ "name": "Bug", "aliases": [...] }],
  "statuses": [{ "name": "Open", "aliases": [...] }],
  "components": [{ "name": "API", "description": "...", "aliases": [...] }]
}
```

### `data/github-sources.json`
GitHub sources for estimation context:
```json
{
  "sources": [
    {
      "owner": "org-name",
      "repo": "repo-name",
      "files": ["README.md", "docs/architecture.md"],
      "ref": "main"
    }
  ]
}
```

## Development Commands

```bash
# Execution
npm start -- search "open bugs from CRM"
npm start -- check TRD-123
npm start -- estimate TRD-456 --verbose

# Development
npm run dev           # Watch mode with tsx
npm run build         # Compile to dist/
npm test              # Tests
npm run lint          # Linting
npm run format        # Format
```

## Key Files

### Current Structure (Legacy)

| File | Description |
|------|-------------|
| `src/index.ts` | Public exports from all modules |
| `src/cli/index.ts` | CLI entry point with 3 commands |
| `src/llm/client.ts` | LangChain client (interpretQuery, evaluate*, estimateEffort) |
| `src/llm/prompts.ts` | System prompts for each feature |
| `src/interpreter/schema.ts` | Zod schema for SearchParams |
| `src/jira/jql-builder.ts` | Deterministic JQL construction |
| `src/github/loader.ts` | GitHub sources loading and context |
| `tsconfig.json` | TypeScript strict configuration |
| `eslint.config.mjs` | Flat config linting rules |
| `jest.config.js` | Jest configuration for ESM |

### Target Structure (Hexagonal)

| File | Description |
|------|-------------|
| `src/domain/models/*.ts` | Domain entities and value objects |
| `src/domain/ports/input/*.port.ts` | Use case interfaces |
| `src/domain/ports/output/*.port.ts` | External service interfaces |
| `src/domain/services/*.service.ts` | Business logic implementation |
| `src/adapters/primary/cli/*.ts` | CLI commands (driving adapters) |
| `src/adapters/secondary/jira/*.ts` | Jira implementation (driven adapter) |
| `src/adapters/secondary/llm/*.ts` | LangChain implementation (driven adapter) |
| `src/adapters/secondary/github/*.ts` | GitHub implementation (driven adapter) |
| `src/config/index.ts` | Configuration and dependency composition |

## Notes for Agents

### Architecture and Refactor

1. **Target architecture is Hexagonal**: Current code is legacy. New features should follow the ports and adapters pattern described above.

2. **Gradual refactor**: Don't rewrite everything at once. Migrate module by module, starting by extracting interfaces (ports) from current implementations.

3. **Domain without dependencies**: Code in `src/domain/` must not import anything from `src/adapters/`. Dependencies point inward.

4. **Dependency injection**: Domain services receive their ports via constructor, enabling testing and substitution.

### Current Implementation

5. **Don't modify prompts without context**: Prompts in `src/llm/prompts.ts` are calibrated for llama.cpp. Changes may affect response quality.

6. **Validation is critical**: Every LLM response must be parsed and validated. LLMs may return `"null"` as string instead of `null`.

7. **ESM requires extensions**: All local imports must include `.js` even though the file is `.ts`.

8. **Tests don't mock LLM**: Current tests are unit tests for deterministic logic. There are no integration tests with LLM.

9. **llama.cpp specific**: The client uses `withStructuredOutput` with raw JSON Schema (not Zod) because llama.cpp requires `function.description`.

### Testing Strategy with Hexagonal

10. **Domain tests**: Mock output ports to test services in isolation.

11. **Adapter tests**: Integration tests with real services (Jira, GitHub) in controlled environment.

12. **E2E tests**: Full flow from CLI to response, with mocked external APIs.
