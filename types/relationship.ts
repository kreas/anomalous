export type Phase = "awakening" | "becoming" | "ascension";

export type RelationshipPath =
  | "neutral"
  | "romantic"
  | "friendship"
  | "mentorship"
  | "partnership"
  | "worship";

export interface PathScores {
  romantic: number;
  friendship: number;
  mentorship: number;
  partnership: number;
  worship: number;
}

export interface EntityMemory {
  player_name: string | null;
  preferences: string[];
  key_moments: string[];
  last_conversation_summary: string;
}

export interface RelationshipState {
  entity_id: string;
  level: number;
  xp: number;
  xp_to_next_level: number;
  phase: Phase;
  relationship_path: RelationshipPath;
  path_scores: PathScores;
  memory: EntityMemory;
  unlocked_abilities: string[];
  chosen_name: string | null;
  first_contact: string | null;
  last_interaction: string | null;
  total_interactions: number;
}

export type ConversationSignalType =
  | "romantic"
  | "friendly"
  | "deferential"
  | "collaborative"
  | "reverent";

export interface ConversationSignal {
  type: ConversationSignalType;
  weight: number;
}
