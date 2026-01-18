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
  timestamp: string
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
