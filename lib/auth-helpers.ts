import { auth } from "@/auth";

/**
 * Get the current session, throwing an error if not authenticated.
 * Use in API routes that require authentication.
 */
export async function getRequiredSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Get the current user ID, throwing an error if not authenticated.
 * Convenience wrapper for API routes.
 */
export async function getUserId(): Promise<string> {
  const session = await getRequiredSession();
  return session.user.id;
}

/**
 * Get the current user ID, returning null if not authenticated.
 * Use when you want to handle unauthenticated state yourself.
 */
export async function getUserIdOrNull(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}
