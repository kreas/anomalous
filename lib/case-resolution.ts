/**
 * Case resolution logic - outcome calculation and rewards
 * Implements US-3.1, US-3.2, US-3.3
 */

import type {
  Case,
  CaseOutcome,
  CaseRewards,
  Evidence,
  EvidenceConnection,
} from "@/types";

/**
 * Outcome multipliers for rewards
 */
const OUTCOME_MULTIPLIERS: Record<CaseOutcome, number> = {
  solved: 1.0,
  partial: 0.6,
  cold: 0.3,
  twist: 1.5,
};

/**
 * Check if evidence satisfies a requirement
 */
function checkEvidenceRequirement(
  requirement: Case["requiredEvidence"][0],
  evidence: Evidence[],
): { satisfied: boolean; count: number } {
  // Filter evidence by type
  let matchingEvidence = evidence.filter((e) => e.type === requirement.type);

  // If specific IDs required, filter further
  if (requirement.specific && requirement.specific.length > 0) {
    matchingEvidence = matchingEvidence.filter((e) =>
      requirement.specific!.includes(e.id),
    );
  }

  const count = matchingEvidence.length;
  const satisfied = count >= requirement.count;

  return { satisfied, count };
}

/**
 * Calculate evidence completeness score (0-1)
 */
export function calculateEvidenceCompleteness(
  caseData: Case,
  evidence: Evidence[],
): number {
  if (caseData.requiredEvidence.length === 0) {
    return 1; // No requirements = complete
  }

  let totalRequired = 0;
  let totalSatisfied = 0;

  for (const req of caseData.requiredEvidence) {
    totalRequired += req.count;
    const { count } = checkEvidenceRequirement(req, evidence);
    totalSatisfied += Math.min(count, req.count);
  }

  return totalRequired > 0 ? totalSatisfied / totalRequired : 1;
}

/**
 * Get missing evidence hints
 */
export function getMissingEvidenceHints(
  caseData: Case,
  evidence: Evidence[],
): string[] {
  const hints: string[] = [];

  for (const req of caseData.requiredEvidence) {
    const { satisfied, count } = checkEvidenceRequirement(req, evidence);

    if (!satisfied) {
      const missing = req.count - count;
      const hint = req.hint || `${req.type} evidence`;
      hints.push(`Need ${missing} more ${hint}`);
    }
  }

  return hints;
}

/**
 * Check for twist conditions
 * Twist occurs when all evidence is found AND special conditions are met
 */
export function checkTwistConditions(
  caseData: Case,
  evidence: Evidence[],
  connections: EvidenceConnection[],
): boolean {
  // For now, twist requires:
  // 1. All evidence found
  // 2. At least one connection discovered that's relevant to the case
  const completeness = calculateEvidenceCompleteness(caseData, evidence);
  if (completeness < 1) return false;

  // Check for case-relevant connections
  const relevantConnections = connections.filter(
    (c) => c.reward?.caseProgress === caseData.id,
  );

  // Twist triggered if player found a special connection
  return relevantConnections.length > 0;
}

/**
 * Calculate case outcome based on evidence and connections
 */
export function calculateOutcome(
  caseData: Case,
  evidence: Evidence[],
  connections: EvidenceConnection[],
): CaseOutcome {
  const completeness = calculateEvidenceCompleteness(caseData, evidence);

  // Check for twist first (requires full evidence + connection)
  if (
    completeness >= 1 &&
    checkTwistConditions(caseData, evidence, connections)
  ) {
    return "twist";
  }

  // Check if case is cold (expired)
  if (caseData.status === "cold") {
    return "cold";
  }

  // Calculate based on completeness
  if (completeness >= 0.9) {
    return "solved";
  }
  if (completeness >= 0.5) {
    return "partial";
  }
  return "cold";
}

/**
 * Calculate rewards based on case and outcome
 */
export function calculateRewards(
  caseData: Case,
  outcome: CaseOutcome,
): CaseRewards {
  const multiplier = OUTCOME_MULTIPLIERS[outcome];
  const base = caseData.rewards;

  return {
    xp: Math.floor(base.xp * multiplier),
    fragments: Math.floor(base.fragments * multiplier),
    entityXp: Math.floor(base.entityXp * multiplier),
    bonusEvidence: outcome === "twist" ? base.bonusEvidence : undefined,
    unlocks:
      outcome === "solved" || outcome === "twist" ? base.unlocks : undefined,
  };
}

/**
 * Generate outcome description message
 */
export function getOutcomeDescription(outcome: CaseOutcome): string {
  const descriptions: Record<CaseOutcome, string> = {
    solved:
      "Case solved! Your investigation was thorough and your theory correct.",
    partial:
      "Case partially solved. You were on the right track, but some details remain unclear.",
    cold: "Case gone cold. Insufficient evidence to reach a conclusion, but the case file has been archived.",
    twist:
      "TWIST REVEALED! Your investigation uncovered a deeper truth that changes everything.",
  };

  return descriptions[outcome];
}

/**
 * Format rewards for display
 */
export function formatRewards(rewards: CaseRewards): string {
  const lines: string[] = [];

  lines.push(`+${rewards.xp} XP`);
  lines.push(`+${rewards.fragments} Fragments`);
  lines.push(`+${rewards.entityXp} Entity XP`);

  if (rewards.bonusEvidence && rewards.bonusEvidence.length > 0) {
    lines.push(`Bonus Evidence: ${rewards.bonusEvidence.join(", ")}`);
  }

  if (rewards.unlocks && rewards.unlocks.length > 0) {
    lines.push(`Unlocked: ${rewards.unlocks.join(", ")}`);
  }

  return lines.join("\n");
}

/**
 * Full resolution result
 */
export interface ResolutionResult {
  outcome: CaseOutcome;
  rewards: CaseRewards;
  description: string;
  formattedRewards: string;
  missingHints?: string[];
}

/**
 * Resolve a case completely
 */
export function resolveCase(
  caseData: Case,
  evidence: Evidence[],
  connections: EvidenceConnection[],
  _theory: string,
): ResolutionResult {
  const completeness = calculateEvidenceCompleteness(caseData, evidence);

  // If not enough evidence, return early with hints
  if (completeness < 0.5) {
    const hints = getMissingEvidenceHints(caseData, evidence);
    return {
      outcome: "cold",
      rewards: calculateRewards(caseData, "cold"),
      description: "Insufficient evidence to resolve this case.",
      formattedRewards: "",
      missingHints: hints,
    };
  }

  const outcome = calculateOutcome(caseData, evidence, connections);
  const rewards = calculateRewards(caseData, outcome);

  return {
    outcome,
    rewards,
    description: getOutcomeDescription(outcome),
    formattedRewards: formatRewards(rewards),
  };
}
