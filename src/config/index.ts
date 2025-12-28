import { config } from "dotenv";
import { z } from "zod";

// Load .env file
config();

const configSchema = z.object({
  jira: z.object({
    baseUrl: z.string().url("JIRA_BASE_URL debe ser una URL válida"),
    email: z.string().email("JIRA_EMAIL debe ser un email válido"),
    apiToken: z.string().min(1, "JIRA_API_TOKEN es requerido"),
  }),
  llama: z.object({
    baseUrl: z.string().url("LLAMA_BASE_URL debe ser una URL válida"),
    model: z.string().optional().default("default"),
  }),
  github: z
    .object({
      token: z.string().min(1, "GITHUB_TOKEN es requerido para repos privados"),
    })
    .optional(),
});

export type Config = z.infer<typeof configSchema>;

let cachedConfig: Config | null = null;

export function getConfig(): Config {
  if (cachedConfig) {
    return cachedConfig;
  }

  const rawConfig = {
    jira: {
      baseUrl: process.env.JIRA_BASE_URL,
      email: process.env.JIRA_EMAIL,
      apiToken: process.env.JIRA_API_TOKEN,
    },
    llama: {
      baseUrl: process.env.LLAMA_BASE_URL,
      model: process.env.LLAMA_MODEL,
    },
    github: process.env.GITHUB_TOKEN
      ? { token: process.env.GITHUB_TOKEN }
      : undefined,
  };

  const result = configSchema.safeParse(rawConfig);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(
      `Error de configuración:\n${errors}\n\nAsegúrate de crear un archivo .env basado en .env.example`
    );
  }

  cachedConfig = result.data;
  return cachedConfig;
}

// Lazy getter for backwards compatibility
export const appConfig = new Proxy({} as Config, {
  get(_target, prop: keyof Config) {
    return getConfig()[prop];
  },
});
