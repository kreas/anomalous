import { getObject, putObject } from "./r2";
import { getUserProfilePath } from "./paths";

export interface UserProfile {
  id: string; // Discord user ID
  nickname: string; // IRC-style name, max 12 chars
  discordUsername: string; // Original Discord username
  discordAvatar: string; // Discord avatar URL (CDN)
  createdAt: string;
  onboardingComplete: boolean;
}

export interface NicknameValidation {
  valid: boolean;
  error?: string;
}

/**
 * Validate a nickname according to IRC-style rules:
 * - Max 12 characters
 * - Must start with a letter
 * - Only alphanumeric, underscores, and hyphens allowed
 */
export function validateNickname(nickname: string): NicknameValidation {
  if (!nickname || nickname.trim().length === 0) {
    return { valid: false, error: "Nickname is required" };
  }

  const trimmed = nickname.trim();

  if (trimmed.length > 12) {
    return { valid: false, error: "Max 12 characters" };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: "At least 2 characters required" };
  }

  if (!/^[a-zA-Z]/.test(trimmed)) {
    return { valid: false, error: "Must start with a letter" };
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(trimmed)) {
    return {
      valid: false,
      error: "Only letters, numbers, underscores, and hyphens allowed",
    };
  }

  return { valid: true };
}

/**
 * Get a user's profile from R2
 */
export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  const path = getUserProfilePath(userId);
  return getObject<UserProfile>(path);
}

/**
 * Create or update a user's profile in R2
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const path = getUserProfilePath(profile.id);
  await putObject(path, profile);
}

/**
 * Create a new profile for a user
 */
export async function createUserProfile(
  userId: string,
  nickname: string,
  discordUsername: string,
  discordAvatar: string,
): Promise<UserProfile> {
  const profile: UserProfile = {
    id: userId,
    nickname: nickname.trim(),
    discordUsername,
    discordAvatar,
    createdAt: new Date().toISOString(),
    onboardingComplete: true,
  };

  await saveUserProfile(profile);
  return profile;
}

/**
 * Update a user's nickname
 */
export async function updateNickname(
  userId: string,
  nickname: string,
): Promise<UserProfile | null> {
  const profile = await getUserProfile(userId);
  if (!profile) {
    return null;
  }

  profile.nickname = nickname.trim();
  await saveUserProfile(profile);
  return profile;
}
