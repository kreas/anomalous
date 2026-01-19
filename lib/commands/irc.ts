/**
 * Core IRC commands - basic chat functionality
 */

import { registerCommand, getCommandHelp, listCommands } from "./registry";

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
  aliases: ["leave"],
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
