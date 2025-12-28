import axios, { AxiosInstance } from "axios";
import { readFileSync } from "fs";
import { resolve } from "path";
import { type CodeContextProviderPort } from "../../../domain/ports/output/code-context-provider.port.js";
import {
  gitHubFileContentSchema,
  gitHubSourcesSchema,
  type GitHubClientOptions,
  type GitHubFileContent,
  type GitHubSources,
  type LoadedFile,
} from "./types.js";

/**
 * GitHub adapter implementing CodeContextProviderPort.
 */
export class GitHubAdapter implements CodeContextProviderPort {
  private client: AxiosInstance;
  private cachedSources: GitHubSources | null = null;

  constructor(options: GitHubClientOptions = {}) {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    this.client = axios.create({
      baseURL: options.baseUrl ?? "https://api.github.com",
      headers,
      timeout: 30000,
    });
  }

  async getContext(sourcesPath?: string): Promise<string> {
    const sources = this.loadSources(sourcesPath);

    if (sources.sources.length === 0) {
      return "";
    }

    const files = await this.fetchFiles(sources);

    if (files.length === 0) {
      return "";
    }

    const sections = files.map((file) => {
      const header = `## ${file.owner}/${file.repo} - ${file.path}`;
      const separator = "-".repeat(Math.min(header.length, 60));
      return `${header}\n${separator}\n\n${file.content}`;
    });

    return `# Documentación de Repositorios GitHub\n\n${sections.join("\n\n---\n\n")}`;
  }

  /**
   * Loads the GitHub sources configuration from a JSON file.
   */
  private loadSources(sourcesPath?: string): GitHubSources {
    if (this.cachedSources) {
      return this.cachedSources;
    }

    const path = sourcesPath ?? resolve(process.cwd(), "data", "github-sources.json");

    try {
      const content = readFileSync(path, "utf-8");
      const parsed = JSON.parse(content);
      const result = gitHubSourcesSchema.safeParse(parsed);

      if (!result.success) {
        const errors = result.error.errors
          .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
          .join("\n");
        throw new Error(`Error en github-sources.json:\n${errors}`);
      }

      this.cachedSources = result.data;
      return this.cachedSources;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`El archivo github-sources.json no es un JSON válido: ${error.message}`);
      }
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return { sources: [] };
      }
      throw error;
    }
  }

  /**
   * Fetches all files from the configured GitHub sources.
   */
  private async fetchFiles(sources: GitHubSources): Promise<LoadedFile[]> {
    const loadedFiles: LoadedFile[] = [];

    for (const source of sources.sources) {
      const files = await this.getMultipleFiles(
        source.owner,
        source.repo,
        source.files,
        source.ref
      );

      for (const file of files) {
        loadedFiles.push({
          owner: source.owner,
          repo: source.repo,
          path: file.path,
          ref: source.ref,
          content: file.content,
        });
      }
    }

    return loadedFiles;
  }

  /**
   * Fetches the content of a file from a GitHub repository.
   */
  private async getFileContent(
    owner: string,
    repo: string,
    path: string,
    ref = "main"
  ): Promise<string> {
    try {
      const response = await this.client.get<GitHubFileContent>(
        `/repos/${owner}/${repo}/contents/${path}`,
        { params: { ref } }
      );

      const parsed = gitHubFileContentSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new Error(
          `La ruta "${path}" no es un archivo válido o tiene un formato inesperado.`
        );
      }

      return Buffer.from(parsed.data.content, "base64").toString("utf-8");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error("Error de autenticación con GitHub. Verifica tu GITHUB_TOKEN.");
        }
        if (error.response?.status === 403) {
          const rateLimitRemaining = error.response.headers["x-ratelimit-remaining"];
          if (rateLimitRemaining === "0") {
            throw new Error(
              "Se ha alcanzado el límite de peticiones de GitHub. Espera un momento o usa un token."
            );
          }
          throw new Error("Acceso denegado al repositorio. Verifica los permisos del token.");
        }
        if (error.response?.status === 404) {
          throw new Error(
            `No se encontró el archivo "${path}" en ${owner}/${repo} (ref: ${ref}).`
          );
        }
        throw new Error(`Error al consultar GitHub: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Fetches multiple files from a repository.
   */
  private async getMultipleFiles(
    owner: string,
    repo: string,
    paths: string[],
    ref = "main"
  ): Promise<Array<{ path: string; content: string }>> {
    const results: Array<{ path: string; content: string }> = [];

    for (const path of paths) {
      try {
        const content = await this.getFileContent(owner, repo, path, ref);
        results.push({ path, content });
      } catch (error) {
        console.warn(
          `No se pudo obtener ${owner}/${repo}/${path}: ${error instanceof Error ? error.message : "Error desconocido"}`
        );
      }
    }

    return results;
  }

  /**
   * Clears the cached sources.
   */
  clearCache(): void {
    this.cachedSources = null;
  }
}

