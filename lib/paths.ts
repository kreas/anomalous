export function getUserProfilePath(userId: string): string {
  return `users/${userId}/profile.json`;
}

export function getEntityPath(userId: string, entityId: string): string {
  return `users/${userId}/entities/${entityId}.json`;
}

export function getRelationshipPath(userId: string, entityId: string): string {
  return `users/${userId}/relationships/${entityId}.json`;
}

export function getConversationPath(
  userId: string,
  entityId: string,
  timestamp: string,
): string {
  return `users/${userId}/conversations/${entityId}/${timestamp}.json`;
}

export function getGameStatePath(userId: string): string {
  return `users/${userId}/game-state.json`;
}

export function getEntitiesPrefix(userId: string): string {
  return `users/${userId}/entities/`;
}

export function getRelationshipsPrefix(userId: string): string {
  return `users/${userId}/relationships/`;
}

// Channel and message paths for Phase 2

export function getChannelStatePath(userId: string): string {
  return `users/${userId}/channels.json`;
}

export function getMessagesPrefix(userId: string, channelId: string): string {
  return `users/${userId}/messages/${channelId}/`;
}

export function getMessageChunkPath(
  userId: string,
  channelId: string,
  chunkKey: string,
): string {
  return `users/${userId}/messages/${channelId}/${chunkKey}.json`;
}

/**
 * Generate an hourly chunk key from a timestamp
 * e.g., "2026-01-18T15:30:00.000Z" -> "2026-01-18T15"
 */
export function getChunkKeyFromTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const iso = date.toISOString();
  // Extract YYYY-MM-DDTHH portion
  return iso.slice(0, 13);
}

/**
 * Get the current chunk key (current hour)
 */
export function getCurrentChunkKey(): string {
  return getChunkKeyFromTimestamp(new Date());
}

// Case paths for Phase 3

/**
 * Get prefix for all available (global) cases
 */
export function getAvailableCasesPrefix(): string {
  return "cases/available/";
}

/**
 * Get path for a single available case
 */
export function getAvailableCasePath(caseId: string): string {
  return `cases/available/${caseId}.json`;
}

/**
 * Get path for user's case state (active + history)
 */
export function getUserCaseStatePath(userId: string): string {
  return `users/${userId}/cases.json`;
}

// Evidence paths for Phase 3

/**
 * Get path for user's evidence inventory
 */
export function getUserEvidencePath(userId: string): string {
  return `users/${userId}/evidence.json`;
}
