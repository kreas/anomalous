/**
 * Evidence types for the investigation system
 * Based on GDD evidence types and user stories US-2.1
 */

/**
 * Evidence types from GDD:
 * - chat_log: Conversations between users. May contain clues, lies, or misdirection.
 * - data_fragment: Corrupted files, partial records, encrypted content.
 * - testimony: Statements from witnesses. Often contradictory.
 * - access_key: Credentials, passwords, channel invites. Unlock new areas.
 * - tool: IRC commands, scripts, parsers. Expand investigation capabilities.
 * - coordinates: Pointers to specific channels, users, or timestamps.
 */
export type EvidenceType =
  | "chat_log"
  | "data_fragment"
  | "testimony"
  | "access_key"
  | "tool"
  | "coordinates";

/**
 * Evidence rarity tiers
 */
export type EvidenceRarity = "common" | "uncommon" | "rare" | "legendary";

/**
 * How evidence was acquired
 */
export type EvidenceSource =
  | "signal" // From /signal pulls (Phase 4)
  | "case_reward" // Awarded from case completion
  | "case_accept" // Granted when accepting a case
  | "exploration" // Found through gameplay
  | "npc" // Given by NPC
  | "tutorial"; // Tutorial grant

/**
 * Main Evidence interface
 */
export interface Evidence {
  /** Unique evidence identifier */
  id: string;
  /** Display name */
  name: string;
  /** Short description (shown before examination) */
  description: string;
  /** Evidence type category */
  type: EvidenceType;
  /** Rarity tier */
  rarity: EvidenceRarity;
  /** Actual content revealed on examination */
  content?: string;
  /** Case IDs this evidence is relevant to */
  caseRelevance?: string[];
  /** When evidence was acquired */
  acquiredAt: string;
  /** How evidence was acquired */
  acquiredFrom?: EvidenceSource;
  /** Whether player has examined this evidence */
  examined: boolean;
  /** When evidence was examined */
  examinedAt?: string;
  /** Evidence IDs this can connect with */
  connections?: string[];
  /** Tags for case matching */
  tags?: string[];
  /** Type-specific metadata */
  metadata?: EvidenceMetadata;
}

/**
 * Type-specific metadata for evidence
 */
export interface EvidenceMetadata {
  /** For chat_log: participants in the conversation */
  participants?: string[];
  /** For testimony: witness name */
  witness?: string;
  /** For access_key: what it unlocks */
  unlocks?: string;
  /** For tool: command it provides */
  command?: string;
  /** For coordinates: target channel/user/timestamp */
  target?: string;
  /** For data_fragment: corruption level (0-1) */
  corruptionLevel?: number;
  /** Generic key-value for future extensions */
  [key: string]: unknown;
}

/**
 * Connection between two evidence pieces
 */
export interface EvidenceConnection {
  /** The two evidence IDs that were connected */
  evidenceIds: [string, string];
  /** When the connection was discovered */
  discoveredAt: string;
  /** What the connection reveals */
  insight: string;
  /** Rewards for discovering this connection */
  reward?: EvidenceConnectionReward;
}

/**
 * Reward for discovering an evidence connection
 */
export interface EvidenceConnectionReward {
  /** New evidence unlocked by this connection */
  newEvidence?: string;
  /** Case ID this advances */
  caseProgress?: string;
  /** XP awarded */
  xp?: number;
  /** Channel/feature unlocked */
  unlock?: string;
}

/**
 * User's evidence inventory state
 */
export interface EvidenceInventory {
  /** All collected evidence */
  items: Evidence[];
  /** Discovered connections */
  connections: EvidenceConnection[];
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Type guard to validate Evidence object
 */
export function isValidEvidence(obj: unknown): obj is Evidence {
  if (typeof obj !== "object" || obj === null) return false;
  const e = obj as Record<string, unknown>;
  return (
    typeof e.id === "string" &&
    typeof e.name === "string" &&
    typeof e.description === "string" &&
    typeof e.type === "string" &&
    typeof e.rarity === "string" &&
    typeof e.acquiredAt === "string" &&
    typeof e.examined === "boolean"
  );
}

/**
 * Type guard for EvidenceInventory
 */
export function isValidEvidenceInventory(
  obj: unknown,
): obj is EvidenceInventory {
  if (typeof obj !== "object" || obj === null) return false;
  const inv = obj as Record<string, unknown>;
  return (
    Array.isArray(inv.items) &&
    Array.isArray(inv.connections) &&
    typeof inv.lastUpdated === "string"
  );
}

/**
 * Type guard for EvidenceConnection
 */
export function isValidEvidenceConnection(
  obj: unknown,
): obj is EvidenceConnection {
  if (typeof obj !== "object" || obj === null) return false;
  const c = obj as Record<string, unknown>;
  return (
    Array.isArray(c.evidenceIds) &&
    c.evidenceIds.length === 2 &&
    typeof c.discoveredAt === "string" &&
    typeof c.insight === "string"
  );
}
