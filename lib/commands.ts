/**
 * IRC command registry and handlers
 */

import type { ChannelState } from "@/types";

/**
 * Parsed command from user input
 */
export interface ParsedCommand {
  command: string;
  args: string[];
  raw: string;
}

/**
 * Context for command execution
 */
export interface CommandContext {
  userId: string;
  currentChannel: string;
  channelState: ChannelState;
  entityUsers: Array<{ id: string; name: string }>;
}

/**
 * Result actions from command execution
 */
export type CommandAction =
  | "switch_channel"
  | "open_query"
  | "close_query"
  | "system_message"
  | "action_message"
  | "clear_display"
  | "send_message"
  | "none";

/**
 * Result of command execution
 */
export interface CommandResult {
  success: boolean;
  message?: string;
  action: CommandAction;
  data?: {
    channelId?: string;
    targetUserId?: string;
    targetUsername?: string;
    messageContent?: string;
  };
}

/**
 * Command definition
 */
export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  usage: string;
  handler: (args: string[], context: CommandContext) => CommandResult;
}

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
export function executeCommand(
  input: string,
  context: CommandContext,
): CommandResult {
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

// =============================================================================
// Core IRC Commands
// =============================================================================

/**
 * /help - Show available commands
 */
registerCommand({
  name: "help",
  aliases: ["h", "?"],
  description: "Show available commands or help for a specific command",
  usage: "/help [command]",
  handler: (args) => {
    if (args.length > 0) {
      const helpText = getCommandHelp(args[0]);
      if (helpText) {
        return {
          success: true,
          message: helpText,
          action: "system_message",
        };
      }
      return {
        success: false,
        message: `Unknown command: ${args[0]}`,
        action: "system_message",
      };
    }

    // List all commands
    const commands = listCommands();
    const commandList = commands
      .map((c) => `  /${c.name} - ${c.description}`)
      .join("\n");

    return {
      success: true,
      message: `Available commands:\n${commandList}`,
      action: "system_message",
    };
  },
});

/**
 * /join - Switch to a channel
 */
registerCommand({
  name: "join",
  aliases: ["j"],
  description: "Switch to a channel",
  usage: "/join #channel",
  handler: (args, context) => {
    if (args.length === 0) {
      return {
        success: false,
        message: "Usage: /join #channel",
        action: "system_message",
      };
    }

    // Remove # prefix if present
    const channelName = args[0].replace(/^#/, "");
    const channel = context.channelState.channels.find(
      (c) => c.name === channelName || c.id === channelName,
    );

    if (!channel) {
      return {
        success: false,
        message: `Channel not found: #${channelName}`,
        action: "system_message",
      };
    }

    if (channel.hidden) {
      return {
        success: false,
        message: `Channel not found: #${channelName}`,
        action: "system_message",
      };
    }

    if (channel.locked) {
      return {
        success: false,
        message: `Channel #${channelName} is locked.`,
        action: "system_message",
      };
    }

    return {
      success: true,
      action: "switch_channel",
      data: { channelId: channel.id },
    };
  },
});

/**
 * /part or /leave - Leave current query window
 */
registerCommand({
  name: "part",
  aliases: ["leave", "close"],
  description: "Close the current query window",
  usage: "/part",
  handler: (_args, context) => {
    // Check if current channel is a query window
    const isQuery = context.currentChannel.startsWith("query-");

    if (!isQuery) {
      return {
        success: false,
        message: "You can only /part from query windows, not channels.",
        action: "system_message",
      };
    }

    return {
      success: true,
      action: "close_query",
      data: { channelId: context.currentChannel },
    };
  },
});

/**
 * /me - Send an action message
 */
registerCommand({
  name: "me",
  aliases: ["action"],
  description: "Send an action message (emote)",
  usage: "/me <action>",
  handler: (args) => {
    if (args.length === 0) {
      return {
        success: false,
        message: "Usage: /me <action>",
        action: "system_message",
      };
    }

    const actionText = args.join(" ");

    return {
      success: true,
      action: "action_message",
      data: { messageContent: actionText },
    };
  },
});

/**
 * /clear - Clear the current channel display
 */
registerCommand({
  name: "clear",
  aliases: ["cls"],
  description: "Clear the current channel's message display",
  usage: "/clear",
  handler: () => {
    return {
      success: true,
      action: "clear_display",
    };
  },
});

/**
 * /msg - Send a private message
 */
registerCommand({
  name: "msg",
  aliases: ["pm", "query", "w"],
  description: "Send a private message to a user",
  usage: "/msg <username> <message>",
  handler: (args, context) => {
    if (args.length < 1) {
      return {
        success: false,
        message: "Usage: /msg <username> <message>",
        action: "system_message",
      };
    }

    const targetUsername = args[0];
    const messageContent = args.slice(1).join(" ");

    // Find target user in entity list
    const targetUser = context.entityUsers.find(
      (u) => u.name.toLowerCase() === targetUsername.toLowerCase(),
    );

    if (!targetUser) {
      return {
        success: false,
        message: `User not found: ${targetUsername}`,
        action: "system_message",
      };
    }

    // If no message provided, just open the query window
    if (!messageContent) {
      return {
        success: true,
        action: "open_query",
        data: {
          targetUserId: targetUser.id,
          targetUsername: targetUser.name,
        },
      };
    }

    // Open query and send message
    return {
      success: true,
      action: "send_message",
      data: {
        targetUserId: targetUser.id,
        targetUsername: targetUser.name,
        messageContent,
      },
    };
  },
});

/**
 * /nick - Change display name (placeholder for future)
 */
registerCommand({
  name: "nick",
  description: "Change your display name (coming soon)",
  usage: "/nick <newname>",
  handler: () => {
    return {
      success: false,
      message: "Nick changes are not yet implemented.",
      action: "system_message",
    };
  },
});

/**
 * /list - List available channels
 */
registerCommand({
  name: "list",
  aliases: ["channels"],
  description: "List available channels",
  usage: "/list",
  handler: (_args, context) => {
    const visibleChannels = context.channelState.channels.filter(
      (c) => !c.hidden,
    );

    const channelList = visibleChannels
      .map((c) => {
        const prefix = c.locked ? "[locked] " : "";
        const current = c.id === context.currentChannel ? " (current)" : "";
        return `  ${prefix}#${c.name}${current}`;
      })
      .join("\n");

    return {
      success: true,
      message: `Channels:\n${channelList}`,
      action: "system_message",
    };
  },
});

/**
 * /users - List users in the current channel
 */
registerCommand({
  name: "users",
  aliases: ["who", "names"],
  description: "List users in the channel",
  usage: "/users",
  handler: (_args, context) => {
    const userList = context.entityUsers.map((u) => `  ${u.name}`).join("\n");

    return {
      success: true,
      message: `Users:\n${userList}`,
      action: "system_message",
    };
  },
});
