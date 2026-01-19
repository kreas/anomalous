/**
 * Message history persistence for channels
 * Messages are chunked by hour to manage R2 file count
 */

import type { ChannelMessage, MessageChunk, GetMessagesOptions } from "@/types";
import { getObject, putObject, listObjects } from "./r2";
import {
  getMessagesPrefix,
  getMessageChunkPath,
  getChunkKeyFromTimestamp,
  getCurrentChunkKey,
} from "./paths";

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new channel message
 */
export function createChannelMessage(
  channelId: string,
  userId: string,
  username: string,
  content: string,
  type: ChannelMessage["type"] = "message"
): ChannelMessage {
  return {
    id: generateMessageId(),
    channelId,
    timestamp: new Date().toISOString(),
    userId,
    username,
    content,
    type,
  };
}

/**
 * Create a system message for a channel
 */
export function createSystemMessage(
  channelId: string,
  content: string
): ChannelMessage {
  return createChannelMessage(channelId, "system", "***", content, "system");
}

/**
 * Get a message chunk from R2
 */
async function getMessageChunk(
  userId: string,
  channelId: string,
  chunkKey: string
): Promise<MessageChunk | null> {
  const path = getMessageChunkPath(userId, channelId, chunkKey);
  return getObject<MessageChunk>(path);
}

/**
 * Save a message chunk to R2
 */
async function saveMessageChunk(
  userId: string,
  channelId: string,
  chunk: MessageChunk
): Promise<void> {
  const path = getMessageChunkPath(userId, channelId, chunk.chunkKey);
  await putObject(path, {
    ...chunk,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Save a message to the current chunk
 */
export async function saveChannelMessage(
  userId: string,
  channelId: string,
  message: ChannelMessage
): Promise<void> {
  const chunkKey = getChunkKeyFromTimestamp(message.timestamp);
  let chunk = await getMessageChunk(userId, channelId, chunkKey);

  if (!chunk) {
    // Create new chunk
    chunk = {
      channelId,
      chunkKey,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  chunk.messages.push(message);
  await saveMessageChunk(userId, channelId, chunk);
}

/**
 * Save multiple messages in a batch
 */
export async function saveChannelMessages(
  userId: string,
  channelId: string,
  messages: ChannelMessage[]
): Promise<void> {
  // Group messages by chunk key
  const messagesByChunk = new Map<string, ChannelMessage[]>();

  for (const message of messages) {
    const chunkKey = getChunkKeyFromTimestamp(message.timestamp);
    const existing = messagesByChunk.get(chunkKey) || [];
    existing.push(message);
    messagesByChunk.set(chunkKey, existing);
  }

  // Save each chunk
  for (const [chunkKey, chunkMessages] of messagesByChunk) {
    let chunk = await getMessageChunk(userId, channelId, chunkKey);

    if (!chunk) {
      chunk = {
        channelId,
        chunkKey,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    chunk.messages.push(...chunkMessages);
    await saveMessageChunk(userId, channelId, chunk);
  }
}

/**
 * List all chunk keys for a channel (sorted by time, newest first)
 */
async function listChunkKeys(
  userId: string,
  channelId: string
): Promise<string[]> {
  const prefix = getMessagesPrefix(userId, channelId);
  const keys = await listObjects(prefix);

  // Extract chunk keys from full paths and sort descending (newest first)
  return keys
    .map((key) => {
      // Extract the chunk key from path like "users/{userId}/messages/{channelId}/2026-01-18T15.json"
      const match = key.match(/\/([^/]+)\.json$/);
      return match ? match[1] : null;
    })
    .filter((key): key is string => key !== null)
    .sort((a, b) => b.localeCompare(a)); // Descending order
}

/**
 * Get the latest messages for a channel
 */
export async function getLatestMessages(
  userId: string,
  channelId: string,
  limit: number = 50
): Promise<ChannelMessage[]> {
  const chunkKeys = await listChunkKeys(userId, channelId);

  const messages: ChannelMessage[] = [];

  // Load chunks until we have enough messages
  for (const chunkKey of chunkKeys) {
    if (messages.length >= limit) break;

    const chunk = await getMessageChunk(userId, channelId, chunkKey);
    if (chunk) {
      // Prepend messages (since we're going newest to oldest chunks)
      messages.unshift(...chunk.messages);
    }
  }

  // Return the latest N messages
  return messages.slice(-limit);
}

/**
 * Get messages with pagination options
 */
export async function getChannelMessages(
  userId: string,
  channelId: string,
  options: GetMessagesOptions = {}
): Promise<ChannelMessage[]> {
  const { limit = 50, before, after } = options;

  // If no pagination, just get latest
  if (!before && !after) {
    return getLatestMessages(userId, channelId, limit);
  }

  const chunkKeys = await listChunkKeys(userId, channelId);
  const messages: ChannelMessage[] = [];

  // Filter and load relevant chunks
  for (const chunkKey of chunkKeys) {
    // Skip chunks that are entirely after our 'before' timestamp
    if (before && chunkKey > getChunkKeyFromTimestamp(before)) {
      continue;
    }

    // Skip chunks that are entirely before our 'after' timestamp
    if (after && chunkKey < getChunkKeyFromTimestamp(after)) {
      continue;
    }

    const chunk = await getMessageChunk(userId, channelId, chunkKey);
    if (chunk) {
      for (const msg of chunk.messages) {
        // Apply timestamp filters
        if (before && msg.timestamp >= before) continue;
        if (after && msg.timestamp <= after) continue;
        messages.push(msg);
      }
    }

    // Stop if we have enough messages
    if (messages.length >= limit) break;
  }

  // Sort by timestamp ascending and limit
  return messages
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .slice(-limit);
}

/**
 * Get messages from the current hour's chunk only (for real-time updates)
 */
export async function getCurrentChunkMessages(
  userId: string,
  channelId: string
): Promise<ChannelMessage[]> {
  const chunkKey = getCurrentChunkKey();
  const chunk = await getMessageChunk(userId, channelId, chunkKey);
  return chunk?.messages || [];
}

/**
 * Check if a channel has any messages
 */
export async function hasChannelMessages(
  userId: string,
  channelId: string
): Promise<boolean> {
  const chunkKeys = await listChunkKeys(userId, channelId);
  return chunkKeys.length > 0;
}

/**
 * Get the most recent message in a channel
 */
export async function getLastMessage(
  userId: string,
  channelId: string
): Promise<ChannelMessage | null> {
  const messages = await getLatestMessages(userId, channelId, 1);
  return messages.length > 0 ? messages[0] : null;
}
