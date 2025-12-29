import { homedir } from "os";
import { join } from "path";
import { existsSync } from "fs";

/**
 * Application name for configuration directory.
 */
const APP_NAME = "ai-ticket-agent";

/**
 * Gets the user configuration directory path.
 * Works on Windows, macOS, and Linux.
 *
 * Priority:
 * 1. XDG_CONFIG_HOME (Linux standard)
 * 2. ~/.ai-ticket-agent/ (cross-platform fallback)
 */
export function getConfigDir(): string {
  // Use XDG_CONFIG_HOME on Linux if available
  const xdgConfig = process.env.XDG_CONFIG_HOME;
  if (xdgConfig && process.platform === "linux") {
    return join(xdgConfig, APP_NAME);
  }

  // For Windows, macOS, and Linux fallback: ~/.ai-ticket-agent
  return join(homedir(), `.${APP_NAME}`);
}

/**
 * Resolves a configuration file path with fallback priority:
 * 1. User config directory (~/.ai-ticket-agent/)
 * 2. Local project data directory (data/)
 *
 * @param filename - The config file name (e.g., 'dictionary.json')
 * @returns The resolved path, or null if not found anywhere
 */
export function resolveConfigFile(filename: string): string | null {
  const userConfigPath = join(getConfigDir(), filename);
  const localPath = join(process.cwd(), "data", filename);

  // Priority: user config > local
  if (existsSync(userConfigPath)) {
    return userConfigPath;
  }

  if (existsSync(localPath)) {
    return localPath;
  }

  return null;
}

/**
 * Gets the path where a config file should be created/edited.
 * Always returns the user config directory path.
 *
 * @param filename - The config file name (e.g., 'dictionary.json')
 * @returns The path in the user config directory
 */
export function getUserConfigPath(filename: string): string {
  return join(getConfigDir(), filename);
}

/**
 * Checks if the user config directory exists.
 */
export function configDirExists(): boolean {
  return existsSync(getConfigDir());
}

/**
 * Gets information about where each config file is loaded from.
 */
export function getConfigFileInfo(filename: string): {
  resolvedPath: string | null;
  userPath: string;
  localPath: string;
  source: "user" | "local" | "none";
} {
  const userPath = getUserConfigPath(filename);
  const localPath = join(process.cwd(), "data", filename);

  const userExists = existsSync(userPath);
  const localExists = existsSync(localPath);

  let resolvedPath: string | null = null;
  let source: "user" | "local" | "none" = "none";

  if (userExists) {
    resolvedPath = userPath;
    source = "user";
  } else if (localExists) {
    resolvedPath = localPath;
    source = "local";
  }

  return {
    resolvedPath,
    userPath,
    localPath,
    source,
  };
}

