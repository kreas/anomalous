/**
 * Query window management for private messages
 */

import type { QueryWindow, ChannelState } from "@/types";
import { addQueryWindow, getOrCreateChannelState, updateQueryWindow } from "./channels";

/**
 * Generate a query window ID from target user ID
 */
export function getQueryWindowId(targetUserId: string): string {
  return `query-${targetUserId}`;
}

/**
 * Create a new query window
 */
export function createQueryWindow(
  targetUserId: string,
  targetUsername: string
): QueryWindow {
  return {
    id: getQueryWindowId(targetUserId),
    name: targetUsername, // Display name in channel list
    type: "query",
    locked: false,
    unreadCount: 0,
    targetUserId,
    targetUsername,
  };
}

/**
 * Get or create a query window for a target user
 */
export async function getOrCreateQueryWindow(
  userId: string,
  targetUserId: string,
  targetUsername: string
): Promise<{ state: ChannelState; queryWindow: QueryWindow; isNew: boolean }> {
  const state = await getOrCreateChannelState(userId);
  const queryWindowId = getQueryWindowId(targetUserId);

  // Check if query window already exists
  const existing = state.queryWindows.find((q) => q.id === queryWindowId);
  if (existing) {
    return { state, queryWindow: existing, isNew: false };
  }

  // Create new query window
  const queryWindow = createQueryWindow(targetUserId, targetUsername);
  const newState = await addQueryWindow(userId, queryWindow);

  return { state: newState, queryWindow, isNew: true };
}

/**
 * Find a query window by target user ID
 */
export function findQueryWindowByTarget(
  state: ChannelState,
  targetUserId: string
): QueryWindow | undefined {
  const queryWindowId = getQueryWindowId(targetUserId);
  return state.queryWindows.find((q) => q.id === queryWindowId);
}

/**
 * Check if a channel ID is a query window
 */
export function isQueryWindowId(channelId: string): boolean {
  return channelId.startsWith("query-");
}

/**
 * Extract target user ID from query window ID
 */
export function getTargetUserIdFromQueryId(queryWindowId: string): string | null {
  if (!isQueryWindowId(queryWindowId)) return null;
  return queryWindowId.replace(/^query-/, "");
}

/**
 * Increment unread count for a query window
 */
export async function incrementQueryUnread(
  userId: string,
  queryWindowId: string,
  increment: number = 1
): Promise<ChannelState | null> {
  const state = await getOrCreateChannelState(userId);
  const queryWindow = state.queryWindows.find((q) => q.id === queryWindowId);

  if (!queryWindow) return null;

  return updateQueryWindow(userId, queryWindowId, {
    unreadCount: queryWindow.unreadCount + increment,
  });
}

/**
 * Mark a query window as read
 */
export async function markQueryRead(
  userId: string,
  queryWindowId: string
): Promise<ChannelState | null> {
  return updateQueryWindow(userId, queryWindowId, {
    unreadCount: 0,
  });
}
