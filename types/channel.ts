/**
 * Channel and message types for Phase 2: Channel & Navigation System
 */

/**
 * Channel types available in AnomaNet
 */
export type ChannelType =
  | "lobby"
  | "mysteries"
  | "tech-support"
  | "off-topic"
  | "signals"
  | "archives"
  | "private"
  | "redacted"
  | "query";

/**
 * Message types for IRC-style communication
 */
export type MessageType = "system" | "message" | "join" | "part" | "action";

/**
 * A message within a channel or query window
 */
export interface ChannelMessage {
  id: string;
  channelId: string;
  timestamp: string; // ISO timestamp
  userId: string;
  username: string;
  content: string;
  type: MessageType;
}

/**
 * A channel in the AnomaNet interface
 */
export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  locked: boolean;
  unlockedAt?: string; // ISO timestamp when unlocked
  unreadCount: number;
  lastMessage?: ChannelMessage;
  description?: string;
  hidden?: boolean; // If true, not shown in channel list until discovered
}

/**
 * A query window for private messages (extends Channel)
 */
export interface QueryWindow extends Channel {
  type: "query";
  targetUserId: string;
  targetUsername: string;
}

/**
 * Persisted channel state for a user
 */
export interface ChannelState {
  channels: Channel[];
  queryWindows: QueryWindow[];
  lastUpdated: string; // ISO timestamp
}

/**
 * A chunk of messages for a channel (stored by hour)
 */
export interface MessageChunk {
  channelId: string;
  chunkKey: string; // e.g., "2026-01-18T15"
  messages: ChannelMessage[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Options for fetching channel messages
 */
export interface GetMessagesOptions {
  limit?: number;
  before?: string; // ISO timestamp for pagination
  after?: string; // ISO timestamp for pagination
}

/**
 * Type guard to check if a channel is a query window
 */
export function isQueryWindow(channel: Channel): channel is QueryWindow {
  return channel.type === "query";
}

/**
 * Type guard to validate a Channel object
 */
export function isValidChannel(obj: unknown): obj is Channel {
  if (!obj || typeof obj !== "object") return false;
  const channel = obj as Record<string, unknown>;
  return (
    typeof channel.id === "string" &&
    typeof channel.name === "string" &&
    typeof channel.type === "string" &&
    typeof channel.locked === "boolean" &&
    typeof channel.unreadCount === "number"
  );
}

/**
 * Type guard to validate a ChannelMessage object
 */
export function isValidChannelMessage(obj: unknown): obj is ChannelMessage {
  if (!obj || typeof obj !== "object") return false;
  const msg = obj as Record<string, unknown>;
  return (
    typeof msg.id === "string" &&
    typeof msg.channelId === "string" &&
    typeof msg.timestamp === "string" &&
    typeof msg.userId === "string" &&
    typeof msg.username === "string" &&
    typeof msg.content === "string" &&
    typeof msg.type === "string"
  );
}
