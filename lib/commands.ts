/**
 * IRC command registry and handlers
 */

import type { ChannelState, Case, Evidence, EvidenceConnection } from "@/types";

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
  | "none"
  // Case actions (Phase 3)
  | "case_accepted"
  | "case_list"
  | "case_detail"
  | "case_abandoned"
  // Evidence actions (Phase 3)
  | "evidence_list"
  | "evidence_detail"
  | "evidence_examined"
  | "connection_found"
  | "connection_failed"
  // Solve actions (Phase 3)
  | "solve_prompt"
  | "case_resolved";

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
    // Case data (Phase 3)
    case?: Case;
    cases?: Case[];
    evidence?: Evidence[];
    // Evidence data (Phase 3)
    evidenceItem?: Evidence;
    evidenceList?: Evidence[];
    newCount?: number;
    content?: string;
    connection?: EvidenceConnection;
    evidenceIds?: [string, string];
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
  handler: (
    args: string[],
    context: CommandContext,
  ) => CommandResult | Promise<CommandResult>;
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

// =============================================================================
// Case Commands (Phase 3)
// =============================================================================

import {
  getAvailableCases,
  getAvailableCase,
  acceptCase as acceptCaseFromStorage,
  getUserCases,
  getActiveCase,
  abandonCase as abandonCaseFromStorage,
  MAX_ACTIVE_CASES,
} from "./cases";

/**
 * /accept - Accept a case from #mysteries
 */
registerCommand({
  name: "accept",
  aliases: ["take"],
  description: "Accept a case from #mysteries",
  usage: "/accept <case_id>",
  handler: async (args, context) => {
    if (args.length === 0) {
      return {
        success: false,
        message: "Usage: /accept <case_id>",
        action: "system_message",
      };
    }

    const caseId = args[0];

    try {
      const acceptedCase = await acceptCaseFromStorage(context.userId, caseId);

      return {
        success: true,
        message: `Case accepted: ${acceptedCase.title}\n\n${acceptedCase.briefing}`,
        action: "case_accepted",
        data: {
          case: acceptedCase,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to accept case";
      return {
        success: false,
        message,
        action: "system_message",
      };
    }
  },
});

/**
 * /cases - List active cases
 */
registerCommand({
  name: "cases",
  aliases: ["mycases", "active"],
  description: "List your active cases",
  usage: "/cases",
  handler: async (_args, context) => {
    try {
      const { active } = await getUserCases(context.userId);

      if (active.length === 0) {
        return {
          success: true,
          message: `No active cases. Visit #mysteries to find cases.\nYou can have up to ${MAX_ACTIVE_CASES} active cases.`,
          action: "system_message",
        };
      }

      const caseList = active
        .map((c, i) => {
          const statusBadge = `[${c.status.toUpperCase()}]`;
          const evidenceCount = c.requiredEvidence.reduce(
            (sum, e) => sum + e.count,
            0,
          );
          return `${i + 1}. ${statusBadge} ${c.title} (${c.type})\n   Evidence needed: ${evidenceCount} items`;
        })
        .join("\n\n");

      return {
        success: true,
        message: `Active Cases (${active.length}/${MAX_ACTIVE_CASES}):\n\n${caseList}\n\nUse /case <id> for details`,
        action: "case_list",
        data: {
          cases: active,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load cases";
      return {
        success: false,
        message,
        action: "system_message",
      };
    }
  },
});

/**
 * /case - Show case details
 */
registerCommand({
  name: "case",
  aliases: ["caseinfo"],
  description: "Show details for a specific case",
  usage: "/case <case_id>",
  handler: async (args, context) => {
    if (args.length === 0) {
      return {
        success: false,
        message: "Usage: /case <case_id>",
        action: "system_message",
      };
    }

    const caseId = args[0];

    try {
      // First check active cases
      let caseData = await getActiveCase(context.userId, caseId);

      // If not active, check available cases
      if (!caseData) {
        caseData = await getAvailableCase(caseId);
      }

      if (!caseData) {
        return {
          success: false,
          message: `Case not found: ${caseId}`,
          action: "system_message",
        };
      }

      const isActive = caseData.status !== "available";
      const statusLine = isActive
        ? `Status: ${caseData.status.toUpperCase()}`
        : "Status: Available (use /accept to take this case)";

      const evidenceReqs = caseData.requiredEvidence
        .map(
          (e) =>
            `  - ${e.type}: ${e.count} needed${e.hint ? ` (${e.hint})` : ""}`,
        )
        .join("\n");

      const rewards = `XP: ${caseData.rewards.xp} | Fragments: ${caseData.rewards.fragments}`;

      const details = [
        `=== ${caseData.title} ===`,
        `Type: ${caseData.type} | Rarity: ${caseData.rarity.toUpperCase()}`,
        statusLine,
        "",
        caseData.briefing,
        "",
        "Evidence Required:",
        evidenceReqs,
        "",
        `Rewards: ${rewards}`,
      ].join("\n");

      return {
        success: true,
        message: details,
        action: "case_detail",
        data: {
          case: caseData,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load case";
      return {
        success: false,
        message,
        action: "system_message",
      };
    }
  },
});

/**
 * /abandon - Abandon an active case
 */
registerCommand({
  name: "abandon",
  aliases: ["drop", "giveup"],
  description: "Abandon an active case",
  usage: "/abandon <case_id>",
  handler: async (args, context) => {
    if (args.length === 0) {
      return {
        success: false,
        message: "Usage: /abandon <case_id>",
        action: "system_message",
      };
    }

    const caseId = args[0];

    try {
      // Check if case exists in active list
      const activeCase = await getActiveCase(context.userId, caseId);
      if (!activeCase) {
        return {
          success: false,
          message: `Case not found in your active cases: ${caseId}`,
          action: "system_message",
        };
      }

      const abandonedCase = await abandonCaseFromStorage(
        context.userId,
        caseId,
      );

      return {
        success: true,
        message: `Case abandoned: ${abandonedCase.title}\nThe case has been moved to your history.`,
        action: "case_abandoned",
        data: {
          case: abandonedCase,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to abandon case";
      return {
        success: false,
        message,
        action: "system_message",
      };
    }
  },
});

/**
 * /mysteries - Show available cases (shortcut to viewing #mysteries content)
 */
registerCommand({
  name: "mysteries",
  aliases: ["available"],
  description: "Show available cases from #mysteries",
  usage: "/mysteries",
  handler: async () => {
    try {
      const cases = await getAvailableCases();

      if (cases.length === 0) {
        return {
          success: true,
          message: "No cases available at this time. Check back later.",
          action: "system_message",
        };
      }

      const caseList = cases
        .slice(0, 10) // Show max 10
        .map((c) => {
          const rarityBadge = `[${c.rarity.toUpperCase()}]`;
          return `${rarityBadge} ${c.title}\n  ${c.description}\n  Reward: ${c.rewards.fragments} Fragments, ${c.rewards.xp} XP\n  /accept ${c.id}`;
        })
        .join("\n\n");

      return {
        success: true,
        message: `=== Available Cases ===\n\n${caseList}`,
        action: "case_list",
        data: {
          cases,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load cases";
      return {
        success: false,
        message,
        action: "system_message",
      };
    }
  },
});

// =============================================================================
// Evidence Commands (Phase 3)
// =============================================================================

import {
  getAllEvidence,
  getEvidenceById,
  getUnexaminedCount,
  examineEvidence as examineEvidenceFromStorage,
  getEvidenceByType,
  connectEvidence as connectEvidenceFromStorage,
  checkConnection,
} from "./evidence";
import { formatEvidenceContent } from "./evidence-formatters";

/**
 * /evidence - List or examine evidence
 */
registerCommand({
  name: "evidence",
  aliases: ["ev", "inventory", "inv"],
  description: "List evidence or examine a specific piece",
  usage: "/evidence [id] [examine]",
  handler: async (args, context) => {
    try {
      // No args - list all evidence
      if (args.length === 0) {
        const evidenceByType = await getEvidenceByType(context.userId);
        const unexaminedCount = await getUnexaminedCount(context.userId);
        const allEvidence = await getAllEvidence(context.userId);

        if (allEvidence.length === 0) {
          return {
            success: true,
            message:
              "Your evidence inventory is empty.\nComplete cases or use /signal to acquire evidence.",
            action: "system_message",
          };
        }

        const typeLabels: Record<string, string> = {
          chat_log: "Chat Logs",
          data_fragment: "Data Fragments",
          testimony: "Testimonies",
          access_key: "Access Keys",
          tool: "Tools",
          coordinates: "Coordinates",
        };

        const sections: string[] = [];
        for (const [type, items] of Object.entries(evidenceByType)) {
          if (items.length === 0) continue;

          const itemList = items
            .map((e) => {
              const newBadge = e.examined ? "" : "[NEW] ";
              return `  ${newBadge}${e.id} - ${e.name}`;
            })
            .join("\n");

          sections.push(`${typeLabels[type] || type}:\n${itemList}`);
        }

        const header = `Evidence Inventory (${allEvidence.length} items${unexaminedCount > 0 ? `, ${unexaminedCount} new` : ""}):\n`;

        return {
          success: true,
          message:
            header +
            "\n" +
            sections.join("\n\n") +
            "\n\nUse /evidence <id> to view, /evidence examine <id> to examine",
          action: "evidence_list",
          data: {
            evidenceList: allEvidence,
            newCount: unexaminedCount,
          },
        };
      }

      // Check for examine subcommand
      if (args[0].toLowerCase() === "examine" && args.length >= 2) {
        const evidenceId = args[1];
        const evidence = await getEvidenceById(context.userId, evidenceId);

        if (!evidence) {
          return {
            success: false,
            message: `Evidence not found: ${evidenceId}`,
            action: "system_message",
          };
        }

        // Already examined - just show content
        if (evidence.examined) {
          const formattedContent = formatEvidenceContent(evidence);
          return {
            success: true,
            message: formattedContent,
            action: "evidence_detail",
            data: {
              evidenceItem: evidence,
              content: evidence.content,
            },
          };
        }

        // Mark as examined
        const examinedEvidence = await examineEvidenceFromStorage(
          context.userId,
          evidenceId,
        );

        const formattedContent = formatEvidenceContent(examinedEvidence);
        const xpReward = getExaminationXP(examinedEvidence.rarity);

        return {
          success: true,
          message: `=== EXAMINING: ${examinedEvidence.name} ===\n\n${formattedContent}\n\n+${xpReward} XP for examination`,
          action: "evidence_examined",
          data: {
            evidenceItem: examinedEvidence,
            content: examinedEvidence.content,
          },
        };
      }

      // View specific evidence
      const evidenceId = args[0];
      const evidence = await getEvidenceById(context.userId, evidenceId);

      if (!evidence) {
        return {
          success: false,
          message: `Evidence not found: ${evidenceId}`,
          action: "system_message",
        };
      }

      const examineStatus = evidence.examined
        ? "Examined"
        : "Not examined - use /evidence examine " + evidenceId;

      const details = [
        `=== ${evidence.name} ===`,
        `Type: ${evidence.type} | Rarity: ${evidence.rarity.toUpperCase()}`,
        `Status: ${examineStatus}`,
        "",
        evidence.description,
      ];

      if (evidence.examined && evidence.content) {
        details.push("");
        details.push(formatEvidenceContent(evidence));
      }

      if (evidence.connections && evidence.connections.length > 0) {
        details.push("");
        details.push(
          `Potential connections: ${evidence.connections.length} items`,
        );
      }

      return {
        success: true,
        message: details.join("\n"),
        action: "evidence_detail",
        data: {
          evidenceItem: evidence,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load evidence";
      return {
        success: false,
        message,
        action: "system_message",
      };
    }
  },
});

/**
 * /connect - Connect two pieces of evidence
 */
registerCommand({
  name: "connect",
  aliases: ["link"],
  description: "Attempt to connect two pieces of evidence",
  usage: "/connect <evidence_id_1> <evidence_id_2>",
  handler: async (args, context) => {
    if (args.length < 2) {
      return {
        success: false,
        message: "Usage: /connect <evidence_id_1> <evidence_id_2>",
        action: "system_message",
      };
    }

    const [evidenceId1, evidenceId2] = args;

    try {
      // First check if connection is possible
      const checkResult = await checkConnection(
        context.userId,
        evidenceId1,
        evidenceId2,
      );

      if (!checkResult.valid) {
        return {
          success: false,
          message: checkResult.insight || "No connection found.",
          action: "connection_failed",
          data: {
            evidenceIds: [evidenceId1, evidenceId2],
          },
        };
      }

      // Create the connection
      const connection = await connectEvidenceFromStorage(
        context.userId,
        evidenceId1,
        evidenceId2,
      );

      const xpReward = connection.reward?.xp || 10;

      return {
        success: true,
        message: `=== CONNECTION DISCOVERED ===\n\n${connection.insight}\n\n+${xpReward} XP`,
        action: "connection_found",
        data: {
          connection,
        },
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to connect evidence";
      return {
        success: false,
        message,
        action: "system_message",
      };
    }
  },
});

/**
 * Calculate XP reward for examining evidence
 */
function getExaminationXP(rarity: string): number {
  const xpByRarity: Record<string, number> = {
    common: 5,
    uncommon: 10,
    rare: 20,
    legendary: 50,
  };
  return xpByRarity[rarity] || 5;
}
