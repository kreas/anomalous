/**
 * Command system entry point
 *
 * This module re-exports the command types and registry functions,
 * and imports all command modules to register them.
 */

// Export types
export type {
  ParsedCommand,
  CommandContext,
  CommandAction,
  ApiCallConfig,
  CommandResult,
  Command,
} from "./types";

// Export registry functions
export {
  registerCommand,
  getCommand,
  getCommandHelp,
  listCommands,
  parseCommand,
  executeCommand,
} from "./registry";

// Import command modules to register all commands
// Order matters: irc commands should be registered first for /help
import "./irc";
import "./cases";
import "./evidence";
