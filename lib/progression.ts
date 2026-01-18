import type {
  RelationshipState,
  Phase,
  RelationshipPath,
  ConversationSignal,
} from "@/types";

export function calculateXPForLevel(level: number): number {
  if (level <= 30) {
    // Awakening: Fast progression (100, 150, 200...)
    return 100 + (level - 1) * 50;
  } else if (level <= 60) {
    // Becoming: Medium progression (500, 600, 700...)
    return 500 + (level - 31) * 100;
  } else {
    // Ascension: Slow progression (2000, 2200, 2400...)
    return 2000 + (level - 61) * 200;
  }
}

export function getPhaseForLevel(level: number): Phase {
  if (level <= 30) return "awakening";
  if (level <= 60) return "becoming";
  return "ascension";
}

export function addXP(
  state: RelationshipState,
  amount: number
): RelationshipState {
  let newXP = state.xp + amount;
  let newLevel = state.level;
  let xpToNext = state.xp_to_next_level;

  // Handle level-ups
  while (newXP >= xpToNext && newLevel < 100) {
    newXP -= xpToNext;
    newLevel += 1;
    xpToNext = calculateXPForLevel(newLevel);
  }

  // Cap at level 100
  if (newLevel >= 100) {
    newLevel = 100;
    newXP = 0;
    xpToNext = 0;
  }

  const newPhase = getPhaseForLevel(newLevel);

  return {
    ...state,
    xp: newXP,
    level: newLevel,
    xp_to_next_level: xpToNext,
    phase: newPhase,
  };
}

const SIGNAL_TO_PATH_MAP: Record<
  ConversationSignal["type"],
  keyof RelationshipState["path_scores"]
> = {
  romantic: "romantic",
  friendly: "friendship",
  deferential: "mentorship",
  collaborative: "partnership",
  reverent: "worship",
};

const PATH_THRESHOLD = 50;

export function updatePathScores(
  state: RelationshipState,
  signals: ConversationSignal[]
): RelationshipState {
  const newScores = { ...state.path_scores };

  for (const signal of signals) {
    const pathKey = SIGNAL_TO_PATH_MAP[signal.type];
    newScores[pathKey] += signal.weight;
  }

  // Determine dominant path
  let dominantPath: RelationshipPath = "neutral";
  let maxScore = PATH_THRESHOLD;

  for (const [path, score] of Object.entries(newScores)) {
    if (score > maxScore) {
      maxScore = score;
      dominantPath = path as RelationshipPath;
    }
  }

  return {
    ...state,
    path_scores: newScores,
    relationship_path: dominantPath,
  };
}

export function getModeForLevel(level: number): string {
  if (level >= 61) return "@";
  if (level >= 31) return "+";
  return "";
}

export function getDisplayName(state: RelationshipState): string {
  if (state.level >= 50 && state.chosen_name) {
    return state.chosen_name;
  }
  return "Anonymous";
}
