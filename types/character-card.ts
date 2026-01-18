export type EntityType = "npc" | "companion" | "anonymous";

export interface AnomaNetExtensions {
  entity_type: EntityType;
  customizable: boolean;
  level_unlocked: number;
  abilities: string[];
}

export interface DepthPrompt {
  prompt: string;
  seed: number;
}

export interface CharacterExtensions {
  anomanet: AnomaNetExtensions;
  depth_prompt?: DepthPrompt;
}

export interface CharacterData {
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;
  creator_notes: string;
  tags: string[];
  creator: string;
  character_version: string;
  system_prompt: string;
  post_history_instructions: string;
  alternate_greetings: string[];
  extensions: CharacterExtensions;
}

export interface CharacterCard {
  spec: "chara_card_v2";
  spec_version: "2.0";
  data: CharacterData;
}

export function isValidCharacterCard(obj: unknown): obj is CharacterCard {
  if (!obj || typeof obj !== "object") return false;
  const card = obj as Record<string, unknown>;

  if (card.spec !== "chara_card_v2") return false;
  if (card.spec_version !== "2.0") return false;
  if (!card.data || typeof card.data !== "object") return false;

  const data = card.data as Record<string, unknown>;
  if (typeof data.name !== "string") return false;
  if (typeof data.personality !== "string") return false;

  if (!data.extensions || typeof data.extensions !== "object") return false;
  const ext = data.extensions as Record<string, unknown>;

  if (!ext.anomanet || typeof ext.anomanet !== "object") return false;
  const anomanet = ext.anomanet as Record<string, unknown>;

  if (!["npc", "companion", "anonymous"].includes(anomanet.entity_type as string))
    return false;

  return true;
}
