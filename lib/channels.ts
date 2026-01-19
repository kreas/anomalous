/**
 * Channel state CRUD operations for R2 storage
 */

import type { Channel, ChannelState, QueryWindow } from "@/types";
import { getObject, putObject } from "./r2";
import { getChannelStatePath } from "./paths";

/**
 * Default channels for new users
 * - Unlocked: lobby, mysteries, tech-support, off-topic
 * - Locked: signals, archives, private
 */
export function createDefaultChannelState(): ChannelState {
  const now = new Date().toISOString();

  const channels: Channel[] = [
    {
      id: "lobby",
      name: "lobby",
      type: "lobby",
      locked: false,
      unreadCount: 0,
      description: "Main gathering place for AnomaNet users",
    },
    {
      id: "mysteries",
      name: "mysteries",
      type: "mysteries",
      locked: false,
      unreadCount: 0,
      description: "Active cases and investigations",
    },
    {
      id: "tech-support",
      name: "tech-support",
      type: "tech-support",
      locked: false,
      unreadCount: 0,
      description: "Help and command documentation",
    },
    {
      id: "off-topic",
      name: "off-topic",
      type: "off-topic",
      locked: false,
      unreadCount: 0,
      description: "Casual chat",
    },
    {
      id: "signals",
      name: "signals",
      type: "signals",
      locked: true,
      unreadCount: 0,
      description: "Signal receiver for evidence pulls",
    },
    {
      id: "archives",
      name: "archives",
      type: "archives",
      locked: true,
      unreadCount: 0,
      description: "Search historical records",
    },
    {
      id: "private",
      name: "private",
      type: "private",
      locked: true,
      unreadCount: 0,
      description: "Private communications",
    },
  ];

  return {
    channels,
    queryWindows: [],
    lastUpdated: now,
  };
}

/**
 * Get channel state from R2
 */
export async function getChannelState(
  userId: string
): Promise<ChannelState | null> {
  const path = getChannelStatePath(userId);
  return getObject<ChannelState>(path);
}

/**
 * Save channel state to R2
 */
export async function saveChannelState(
  userId: string,
  state: ChannelState
): Promise<void> {
  const path = getChannelStatePath(userId);
  const updated: ChannelState = {
    ...state,
    lastUpdated: new Date().toISOString(),
  };
  await putObject(path, updated);
}

/**
 * Get or create channel state (lazy initialization)
 */
export async function getOrCreateChannelState(
  userId: string
): Promise<ChannelState> {
  const existing = await getChannelState(userId);
  if (existing) {
    return existing;
  }

  const defaultState = createDefaultChannelState();
  await saveChannelState(userId, defaultState);
  return defaultState;
}

/**
 * Update a single channel's properties
 */
export async function updateChannel(
  userId: string,
  channelId: string,
  updates: Partial<Omit<Channel, "id">>
): Promise<ChannelState | null> {
  const state = await getChannelState(userId);
  if (!state) return null;

  const channelIndex = state.channels.findIndex((c) => c.id === channelId);
  if (channelIndex === -1) return null;

  state.channels[channelIndex] = {
    ...state.channels[channelIndex],
    ...updates,
  };

  await saveChannelState(userId, state);
  return state;
}

/**
 * Get a specific channel by ID
 */
export function getChannelById(
  state: ChannelState,
  channelId: string
): Channel | QueryWindow | undefined {
  // Check regular channels first
  const channel = state.channels.find((c) => c.id === channelId);
  if (channel) return channel;

  // Check query windows
  return state.queryWindows.find((q) => q.id === channelId);
}

/**
 * Check if a channel is unlocked
 */
export function isChannelUnlocked(state: ChannelState, channelId: string): boolean {
  const channel = getChannelById(state, channelId);
  return channel ? !channel.locked : false;
}

/**
 * Unlock a channel
 */
export async function unlockChannel(
  userId: string,
  channelId: string
): Promise<ChannelState | null> {
  return updateChannel(userId, channelId, {
    locked: false,
    unlockedAt: new Date().toISOString(),
  });
}

/**
 * Mark a channel as read (reset unread count)
 */
export async function markChannelRead(
  userId: string,
  channelId: string
): Promise<ChannelState | null> {
  return updateChannel(userId, channelId, {
    unreadCount: 0,
  });
}

/**
 * Increment unread count for a channel
 */
export async function incrementUnreadCount(
  userId: string,
  channelId: string,
  increment: number = 1
): Promise<ChannelState | null> {
  const state = await getChannelState(userId);
  if (!state) return null;

  const channel = getChannelById(state, channelId);
  if (!channel) return null;

  return updateChannel(userId, channelId, {
    unreadCount: channel.unreadCount + increment,
  });
}

/**
 * Add a query window to channel state
 */
export async function addQueryWindow(
  userId: string,
  queryWindow: QueryWindow
): Promise<ChannelState> {
  const state = await getOrCreateChannelState(userId);

  // Check if query window already exists
  const existing = state.queryWindows.find((q) => q.id === queryWindow.id);
  if (existing) {
    return state;
  }

  state.queryWindows.push(queryWindow);
  await saveChannelState(userId, state);
  return state;
}

/**
 * Remove a query window from channel state
 */
export async function removeQueryWindow(
  userId: string,
  queryWindowId: string
): Promise<ChannelState | null> {
  const state = await getChannelState(userId);
  if (!state) return null;

  state.queryWindows = state.queryWindows.filter((q) => q.id !== queryWindowId);
  await saveChannelState(userId, state);
  return state;
}

/**
 * Update a query window's properties
 */
export async function updateQueryWindow(
  userId: string,
  queryWindowId: string,
  updates: Partial<Omit<QueryWindow, "id" | "type">>
): Promise<ChannelState | null> {
  const state = await getChannelState(userId);
  if (!state) return null;

  const queryIndex = state.queryWindows.findIndex((q) => q.id === queryWindowId);
  if (queryIndex === -1) return null;

  state.queryWindows[queryIndex] = {
    ...state.queryWindows[queryIndex],
    ...updates,
  };

  await saveChannelState(userId, state);
  return state;
}

/**
 * Get all visible channels (excludes hidden channels)
 */
export function getVisibleChannels(state: ChannelState): Channel[] {
  return state.channels.filter((c) => !c.hidden);
}

/**
 * Discover a hidden channel (set hidden to false and unlock it)
 */
export async function discoverChannel(
  userId: string,
  channelId: string
): Promise<ChannelState | null> {
  return updateChannel(userId, channelId, {
    hidden: false,
    locked: false,
    unlockedAt: new Date().toISOString(),
  });
}
