/**
 * IRC command registry and handlers
 *
 * This file re-exports from the modular commands structure for backwards compatibility.
 * The actual command implementations are in lib/commands/
 */

export type {
  ParsedCommand,
  CommandContext,
  CommandAction,
  ApiCallConfig,
  CommandResult,
  Command,
} from "./commands/index";

export {
  registerCommand,
  getCommand,
  getCommandHelp,
  listCommands,
  parseCommand,
  executeCommand,
} from "./commands/index";
