/**
 * Case CRUD operations for R2 storage
 * Implements US-1.2: Case Storage in R2
 */

import { getObject, putObject, listObjects } from "./r2";
import {
  getAvailableCasesPrefix,
  getAvailableCasePath,
  getUserCaseStatePath,
} from "./paths";
import type {
  Case,
  CaseOutcome,
  CaseStatus,
  UserCaseState,
} from "@/types";
import { isValidCase, isValidUserCaseState } from "@/types";

/** Maximum number of active cases a user can have */
export const MAX_ACTIVE_CASES = 3;

/**
 * Create default empty user case state
 */
export function createDefaultUserCaseState(): UserCaseState {
  return {
    active: [],
    history: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get all available cases from the global pool
 */
export async function getAvailableCases(): Promise<Case[]> {
  const prefix = getAvailableCasesPrefix();
  const keys = await listObjects(prefix);

  const cases: Case[] = [];
  for (const key of keys) {
    const caseData = await getObject<Case>(key);
    if (caseData && isValidCase(caseData)) {
      cases.push(caseData);
    }
  }

  // Sort by posted date, newest first
  return cases.sort((a, b) =>
    new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );
}

/**
 * Get a single available case by ID
 */
export async function getAvailableCase(caseId: string): Promise<Case | null> {
  const path = getAvailableCasePath(caseId);
  const caseData = await getObject<Case>(path);

  if (caseData && isValidCase(caseData)) {
    return caseData;
  }
  return null;
}

/**
 * Save a case to the available pool (for seeding/generation)
 */
export async function saveAvailableCase(caseData: Case): Promise<void> {
  const path = getAvailableCasePath(caseData.id);
  await putObject(path, caseData);
}

/**
 * Get user's case state (active and history)
 */
export async function getUserCaseState(userId: string): Promise<UserCaseState | null> {
  const path = getUserCaseStatePath(userId);
  const state = await getObject<UserCaseState>(path);

  if (state && isValidUserCaseState(state)) {
    return state;
  }
  return null;
}

/**
 * Get or create user's case state
 */
export async function getOrCreateUserCaseState(userId: string): Promise<UserCaseState> {
  const existing = await getUserCaseState(userId);
  if (existing) {
    return existing;
  }

  const defaultState = createDefaultUserCaseState();
  await saveUserCaseState(userId, defaultState);
  return defaultState;
}

/**
 * Save user's case state
 */
export async function saveUserCaseState(
  userId: string,
  state: UserCaseState
): Promise<void> {
  const path = getUserCaseStatePath(userId);
  const updated = {
    ...state,
    lastUpdated: new Date().toISOString(),
  };
  await putObject(path, updated);
}

/**
 * Get user's active and completed cases
 */
export async function getUserCases(userId: string): Promise<{
  active: Case[];
  history: Case[];
}> {
  const state = await getOrCreateUserCaseState(userId);
  return {
    active: state.active,
    history: state.history,
  };
}

/**
 * Accept a case - copy it to user's active list
 * @throws Error if case not found, already accepted, or max cases reached
 */
export async function acceptCase(userId: string, caseId: string): Promise<Case> {
  // Get the available case
  const availableCase = await getAvailableCase(caseId);
  if (!availableCase) {
    throw new Error(`Case not found: ${caseId}`);
  }

  // Get user's current case state
  const state = await getOrCreateUserCaseState(userId);

  // Check if already accepted
  if (state.active.some(c => c.id === caseId)) {
    throw new Error(`Case already accepted: ${caseId}`);
  }

  // Check if in history
  if (state.history.some(c => c.id === caseId)) {
    throw new Error(`Case already completed: ${caseId}`);
  }

  // Check max active cases
  if (state.active.length >= MAX_ACTIVE_CASES) {
    throw new Error(`Maximum active cases (${MAX_ACTIVE_CASES}) reached. Abandon or solve a case first.`);
  }

  // Create the accepted case
  const acceptedCase: Case = {
    ...availableCase,
    status: "accepted",
    acceptedAt: new Date().toISOString(),
  };

  // Update user state
  state.active.push(acceptedCase);
  await saveUserCaseState(userId, state);

  return acceptedCase;
}

/**
 * Update a user's active case
 */
export async function updateUserCase(
  userId: string,
  caseId: string,
  updates: Partial<Case>
): Promise<Case> {
  const state = await getOrCreateUserCaseState(userId);

  const caseIndex = state.active.findIndex(c => c.id === caseId);
  if (caseIndex === -1) {
    throw new Error(`Active case not found: ${caseId}`);
  }

  const updatedCase: Case = {
    ...state.active[caseIndex],
    ...updates,
  };

  state.active[caseIndex] = updatedCase;
  await saveUserCaseState(userId, state);

  return updatedCase;
}

/**
 * Complete a case - move to history with outcome
 */
export async function completeCase(
  userId: string,
  caseId: string,
  outcome: CaseOutcome,
  theory: string
): Promise<Case> {
  const state = await getOrCreateUserCaseState(userId);

  const caseIndex = state.active.findIndex(c => c.id === caseId);
  if (caseIndex === -1) {
    throw new Error(`Active case not found: ${caseId}`);
  }

  // Map outcome to status
  const statusMap: Record<CaseOutcome, CaseStatus> = {
    solved: "solved",
    partial: "partial",
    cold: "cold",
    twist: "solved", // Twist is a special solved
  };

  const completedCase: Case = {
    ...state.active[caseIndex],
    status: statusMap[outcome],
    outcome,
    theory,
    solvedAt: new Date().toISOString(),
  };

  // Remove from active, add to history
  state.active.splice(caseIndex, 1);
  state.history.unshift(completedCase); // Most recent first

  await saveUserCaseState(userId, state);

  return completedCase;
}

/**
 * Abandon a case - move to history without solving
 */
export async function abandonCase(userId: string, caseId: string): Promise<Case> {
  const state = await getOrCreateUserCaseState(userId);

  const caseIndex = state.active.findIndex(c => c.id === caseId);
  if (caseIndex === -1) {
    throw new Error(`Active case not found: ${caseId}`);
  }

  const abandonedCase: Case = {
    ...state.active[caseIndex],
    status: "abandoned",
    solvedAt: new Date().toISOString(), // Track when abandoned
  };

  // Remove from active, add to history
  state.active.splice(caseIndex, 1);
  state.history.unshift(abandonedCase);

  await saveUserCaseState(userId, state);

  return abandonedCase;
}

/**
 * Get a specific active case by ID
 */
export async function getActiveCase(
  userId: string,
  caseId: string
): Promise<Case | null> {
  const state = await getOrCreateUserCaseState(userId);
  return state.active.find(c => c.id === caseId) || null;
}

/**
 * Check if a case has expired and update status to cold
 */
export async function checkCaseExpiration(
  userId: string,
  caseId: string
): Promise<Case | null> {
  const state = await getOrCreateUserCaseState(userId);
  const caseData = state.active.find(c => c.id === caseId);

  if (!caseData) return null;
  if (!caseData.expiresAt) return caseData; // No expiration

  const now = new Date();
  const expiresAt = new Date(caseData.expiresAt);

  if (now > expiresAt && caseData.status !== "cold") {
    // Case has expired, mark as cold
    return updateUserCase(userId, caseId, { status: "cold" });
  }

  return caseData;
}

/**
 * Check all user's cases for expiration
 */
export async function checkAllCaseExpirations(userId: string): Promise<void> {
  const state = await getOrCreateUserCaseState(userId);

  for (const caseData of state.active) {
    if (caseData.expiresAt) {
      await checkCaseExpiration(userId, caseData.id);
    }
  }
}
