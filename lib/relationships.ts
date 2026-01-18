import { getObject, putObject } from "./r2";
import { getRelationshipPath } from "./paths";
import type { RelationshipState, Phase } from "@/types";
import { calculateXPForLevel } from "./progression";

export function createDefaultRelationshipState(
  entityId: string,
): RelationshipState {
  return {
    entity_id: entityId,
    level: 1,
    xp: 0,
    xp_to_next_level: calculateXPForLevel(1),
    phase: "awakening" as Phase,
    relationship_path: "neutral",
    path_scores: {
      romantic: 0,
      friendship: 0,
      mentorship: 0,
      partnership: 0,
      worship: 0,
    },
    memory: {
      player_name: null,
      preferences: [],
      key_moments: [],
      last_conversation_summary: "",
    },
    unlocked_abilities: [],
    chosen_name: null,
    first_contact: new Date().toISOString(),
    last_interaction: null,
    total_interactions: 0,
  };
}

export async function getRelationshipState(
  userId: string,
  entityId: string,
): Promise<RelationshipState | null> {
  const path = getRelationshipPath(userId, entityId);
  return getObject<RelationshipState>(path);
}

export async function saveRelationshipState(
  userId: string,
  entityId: string,
  state: RelationshipState,
): Promise<void> {
  const path = getRelationshipPath(userId, entityId);
  await putObject(path, state);
}

export async function getOrCreateRelationshipState(
  userId: string,
  entityId: string,
): Promise<RelationshipState> {
  const existing = await getRelationshipState(userId, entityId);

  if (existing) {
    return existing;
  }

  const defaultState = createDefaultRelationshipState(entityId);
  await saveRelationshipState(userId, entityId, defaultState);
  return defaultState;
}

export async function updateInteractionTimestamp(
  userId: string,
  entityId: string,
): Promise<RelationshipState> {
  const state = await getOrCreateRelationshipState(userId, entityId);

  state.last_interaction = new Date().toISOString();
  state.total_interactions += 1;

  await saveRelationshipState(userId, entityId, state);
  return state;
}
