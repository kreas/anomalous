/**
 * Command registry - manages command registration and lookup
 */

import type { Command, ParsedCommand, CommandContext, CommandResult } from "./types";

/**
 * Command registry
 */
const commandRegistry = new Map<string, Command>();

/**
 * Register a command
 */
export function registerCommand(command: Command): void {
  commandRegistry.set(command.name.toLowerCase(), command);

  // Register aliases
  if (command.aliases) {
    for (const alias of command.aliases) {
      commandRegistry.set(alias.toLowerCase(), command);
    }
  }
}

/**
 * Get a command by name or alias
 */
export function getCommand(name: string): Command | undefined {
  return commandRegistry.get(name.toLowerCase());
}

/**
 * Get help text for a command
 */
export function getCommandHelp(name: string): string | null {
  const command = getCommand(name);
  if (!command) return null;

  return `${command.name}: ${command.description}\nUsage: ${command.usage}`;
}

/**
 * List all registered commands
 */
export function listCommands(): Command[] {
  // Get unique commands (avoid aliases showing up multiple times)
  const seen = new Set<string>();
  const commands: Command[] = [];

  for (const command of commandRegistry.values()) {
    if (!seen.has(command.name)) {
      seen.add(command.name);
      commands.push(command);
    }
  }

  return commands.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Parse user input into a command
 */
export function parseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;

  const parts = trimmed.slice(1).split(/\s+/);
  const command = parts[0]?.toLowerCase();

  if (!command) return null;

  return {
    command,
    args: parts.slice(1),
    raw: trimmed,
  };
}

/**
 * Execute a command from user input
 */
export async function executeCommand(
  input: string,
  context: CommandContext,
): Promise<CommandResult> {
  const parsed = parseCommand(input);

  if (!parsed) {
    return {
      success: false,
      message: "Not a command",
      action: "none",
    };
  }

  const command = getCommand(parsed.command);

  if (!command) {
    return {
      success: false,
      message: `Unknown command: /${parsed.command}. Type /help for available commands.`,
      action: "system_message",
    };
  }

  return command.handler(parsed.args, context);
}
