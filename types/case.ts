/**
 * Case types for the investigation system
 * Based on GDD case types and user stories US-1.1
 */

/**
 * Case types from GDD:
 * - missing_person: A user hasn't logged in. Find out why.
 * - information_brokering: Someone wants data. Find and deliver it (or don't).
 * - infiltration: Gain access to a locked channel or private conversation.
 * - exposure: Unmask an anonymous user doing something nefarious.
 * - recovery: Retrieve corrupted or deleted files.
 * - anomaly: Something impossible is happening. Explain it.
 */
export type CaseType =
  | "missing_person"
  | "information_brokering"
  | "infiltration"
  | "exposure"
  | "recovery"
  | "anomaly";

/**
 * Case rarity from GDD:
 * - common: Simple investigations, 2-3 evidence pieces
 * - uncommon: Branching paths, red herrings
 * - rare: Multi-session arcs, requires specific evidence combinations
 * - legendary: Story arc cases that unfold over weeks
 */
export type CaseRarity = "common" | "uncommon" | "rare" | "legendary";

/**
 * Case status tracking
 */
export type CaseStatus =
  | "available" // In the global pool, can be accepted
  | "accepted" // Player has taken the case
  | "in_progress" // Player is actively investigating
  | "solved" // Case completed successfully
  | "partial" // Case completed with partial success
  | "failed" // Case failed (time expired, wrong solution)
  | "abandoned" // Player gave up
  | "cold"; // Expired but still solvable with reduced rewards

/**
 * Case resolution outcomes from GDD:
 * - solved: Correct theory, full rewards
 * - partial: Close but incomplete, reduced rewards
 * - cold: Insufficient evidence, minimal rewards
 * - twist: Unexpected consequences, bonus rewards
 */
export type CaseOutcome = "solved" | "partial" | "cold" | "twist";

/**
 * Evidence requirement for a case
 */
export interface RequiredEvidence {
  /** Evidence type needed */
  type: import("./evidence").EvidenceType;
  /** Number of this type needed */
  count: number;
  /** Specific evidence IDs that satisfy this requirement (optional) */
  specific?: string[];
  /** Hint shown to player about what's needed */
  hint?: string;
}

/**
 * Rewards for completing a case
 */
export interface CaseRewards {
  /** Player XP */
  xp: number;
  /** Currency (Fragments) */
  fragments: number;
  /** Entity relationship XP */
  entityXp: number;
  /** Bonus evidence IDs awarded */
  bonusEvidence?: string[];
  /** Channel/feature unlocks triggered */
  unlocks?: string[];
}

/**
 * Case source - who posted the case
 */
export type CaseSource = "anonymous_tip" | "system_alert" | "npc_request";

/**
 * Main Case interface
 */
export interface Case {
  /** Unique case identifier */
  id: string;
  /** Case title displayed in #mysteries */
  title: string;
  /** Short description for case list */
  description: string;
  /** Full briefing shown after acceptance */
  briefing: string;
  /** Case type category */
  type: CaseType;
  /** Rarity tier */
  rarity: CaseRarity;
  /** Current status */
  status: CaseStatus;
  /** Evidence requirements to solve */
  requiredEvidence: RequiredEvidence[];
  /** Rewards for completion */
  rewards: CaseRewards;
  /** When the case was posted */
  postedAt: string;
  /** Optional expiration timestamp */
  expiresAt?: string;
  /** When player accepted (if accepted) */
  acceptedAt?: string;
  /** When case was resolved (if resolved) */
  solvedAt?: string;
  /** NPC who posted the case (for Phase 6) */
  clientId?: string;
  /** Resolution outcome */
  outcome?: CaseOutcome;
  /** Whether twist has been revealed */
  twistRevealed?: boolean;
  /** Player's submitted theory */
  theory?: string;
  /** Source of the case */
  source: CaseSource;
}

/**
 * User's case state - active and history
 */
export interface UserCaseState {
  /** Currently active cases (max 3) */
  active: Case[];
  /** Completed/abandoned case history */
  history: Case[];
  /** Last updated timestamp */
  lastUpdated: string;
}

/**
 * Type guard to validate Case object
 */
export function isValidCase(obj: unknown): obj is Case {
  if (typeof obj !== "object" || obj === null) return false;
  const c = obj as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.description === "string" &&
    typeof c.briefing === "string" &&
    typeof c.type === "string" &&
    typeof c.rarity === "string" &&
    typeof c.status === "string" &&
    Array.isArray(c.requiredEvidence) &&
    typeof c.rewards === "object" &&
    c.rewards !== null &&
    typeof c.postedAt === "string" &&
    typeof c.source === "string"
  );
}

/**
 * Type guard for UserCaseState
 */
export function isValidUserCaseState(obj: unknown): obj is UserCaseState {
  if (typeof obj !== "object" || obj === null) return false;
  const s = obj as Record<string, unknown>;
  return (
    Array.isArray(s.active) &&
    Array.isArray(s.history) &&
    typeof s.lastUpdated === "string"
  );
}
