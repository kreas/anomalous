/**
 * Channel unlock conditions and triggers
 */

import type { ChannelState } from "@/types";
import type { RelationshipState } from "@/types";
import { getOrCreateChannelState, updateChannel } from "./channels";
import { getOrCreateRelationshipState } from "./relationships";
import { ANONYMOUS_ENTITY_ID } from "./constants";

/**
 * Types of unlock conditions
 */
export type UnlockConditionType =
  | "level"
  | "case_complete"
  | "case_solved"
  | "relationship"
  | "discovery";

/**
 * A single unlock condition
 */
export interface UnlockCondition {
  type: UnlockConditionType;
  value: number | string;
  description?: string;
}

/**
 * Context for evaluating unlock conditions
 */
export interface UnlockContext {
  level: number;
  casesCompleted: number;
  casesSolved: number;
  relationshipPath: string;
  totalInteractions: number;
}

/**
 * Unlock conditions for each channel (OR logic - any condition unlocks)
 */
export const UNLOCK_CONDITIONS: Record<string, UnlockCondition[]> = {
  signals: [
    { type: "level", value: 5, description: "Reach level 5" },
    { type: "case_complete", value: 1, description: "Complete your first case" },
  ],
  archives: [
    { type: "level", value: 10, description: "Reach level 10" },
    { type: "case_solved", value: 1, description: "Solve your first case" },
  ],
  private: [
    { type: "level", value: 15, description: "Reach level 15" },
    { type: "relationship", value: "milestone_1", description: "Reach a relationship milestone" },
  ],
};

/**
 * Relationship milestones that can unlock channels
 */
const RELATIONSHIP_MILESTONES: Record<string, (state: RelationshipState) => boolean> = {
  milestone_1: (state) => state.total_interactions >= 50,
  milestone_2: (state) => state.total_interactions >= 100,
  intimate: (state) =>
    state.relationship_path !== "neutral" &&
    Math.max(...Object.values(state.path_scores)) >= 50,
};

/**
 * Evaluate a single unlock condition
 */
export function evaluateCondition(
  condition: UnlockCondition,
  context: UnlockContext,
  relationshipState?: RelationshipState
): boolean {
  switch (condition.type) {
    case "level":
      return context.level >= (condition.value as number);

    case "case_complete":
      return context.casesCompleted >= (condition.value as number);

    case "case_solved":
      return context.casesSolved >= (condition.value as number);

    case "relationship":
      if (!relationshipState) return false;
      const milestoneFn = RELATIONSHIP_MILESTONES[condition.value as string];
      return milestoneFn ? milestoneFn(relationshipState) : false;

    case "discovery":
      // Discovery conditions are triggered externally (evidence, hints, etc.)
      // They can't be evaluated from context alone
      return false;

    default:
      return false;
  }
}

/**
 * Check which channels should be unlocked based on current context
 * Returns array of channel IDs that are newly unlockable
 */
export function getUnlockableChannels(
  channelState: ChannelState,
  context: UnlockContext,
  relationshipState?: RelationshipState
): string[] {
  const unlockable: string[] = [];

  for (const [channelId, conditions] of Object.entries(UNLOCK_CONDITIONS)) {
    // Find the channel in state
    const channel = channelState.channels.find((c) => c.id === channelId);

    // Skip if channel doesn't exist or is already unlocked
    if (!channel || !channel.locked) continue;

    // Check if any condition is met (OR logic)
    const shouldUnlock = conditions.some((condition) =>
      evaluateCondition(condition, context, relationshipState)
    );

    if (shouldUnlock) {
      unlockable.push(channelId);
    }
  }

  return unlockable;
}

/**
 * Build unlock context from user's current state
 */
export async function buildUnlockContext(
  userId: string
): Promise<UnlockContext> {
  const relationshipState = await getOrCreateRelationshipState(
    userId,
    ANONYMOUS_ENTITY_ID
  );

  // TODO: Add case tracking when Phase 3 is implemented
  return {
    level: relationshipState.level,
    casesCompleted: 0,
    casesSolved: 0,
    relationshipPath: relationshipState.relationship_path,
    totalInteractions: relationshipState.total_interactions,
  };
}

/**
 * Check and perform any channel unlocks for a user
 * Returns array of newly unlocked channel IDs
 */
export async function checkAndUnlockChannels(
  userId: string
): Promise<string[]> {
  const channelState = await getOrCreateChannelState(userId);
  const context = await buildUnlockContext(userId);
  const relationshipState = await getOrCreateRelationshipState(
    userId,
    ANONYMOUS_ENTITY_ID
  );

  const unlockable = getUnlockableChannels(channelState, context, relationshipState);

  // Unlock each channel
  for (const channelId of unlockable) {
    await updateChannel(userId, channelId, {
      locked: false,
      unlockedAt: new Date().toISOString(),
    });
  }

  return unlockable;
}

/**
 * Get unlock hints for a locked channel
 * Returns human-readable descriptions of unlock conditions
 */
export function getUnlockHints(channelId: string): string[] {
  const conditions = UNLOCK_CONDITIONS[channelId];
  if (!conditions) return [];

  return conditions
    .filter((c) => c.description)
    .map((c) => c.description as string);
}

/**
 * Manually unlock a channel via discovery (external trigger)
 * Used for hidden channels or special events
 */
export async function discoverAndUnlockChannel(
  userId: string,
  channelId: string
): Promise<boolean> {
  const state = await getOrCreateChannelState(userId);
  const channel = state.channels.find((c) => c.id === channelId);

  if (!channel) return false;

  await updateChannel(userId, channelId, {
    locked: false,
    hidden: false,
    unlockedAt: new Date().toISOString(),
  });

  return true;
}

/**
 * Create an unlock notification message
 */
export function createUnlockNotification(channelId: string): string {
  return `*** New channel unlocked: #${channelId}`;
}

/**
 * Create a dramatic discovery notification for hidden channels
 */
export function createDiscoveryNotification(channelId: string): string {
  return `*** CHANNEL REVEALED: #${channelId}`;
}
