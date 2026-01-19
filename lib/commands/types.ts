/**
 * Command system types and interfaces
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
  // API call action - tells client to make an API request
  | "api_call"
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
  | "case_resolved"
  // Auth actions
  | "auth_signout";

/**
 * API call configuration for client-side execution
 */
export interface ApiCallConfig {
  endpoint: string;
  method: "GET" | "POST";
  body?: Record<string, unknown>;
  // Handler name to process the response
  handler: string;
}

/**
 * Result of command execution
 */
export interface CommandResult {
  success: boolean;
  message?: string;
  action: CommandAction;
  // API call configuration for client-side execution
  apiCall?: ApiCallConfig;
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
