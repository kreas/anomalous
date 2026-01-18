export const DEV_USER_ID =
  process.env.DEV_USER_ID || "dev-user-00000000-0000-0000-0000-000000000000";

export const ANONYMOUS_ENTITY_ID = "anonymous";

// Log warning if using dev user in production
if (
  typeof window === "undefined" &&
  process.env.NODE_ENV === "production" &&
  !process.env.DEV_USER_ID
) {
  console.warn(
    "[AnomaNet] Using static dev user ID in production. Set DEV_USER_ID or implement authentication."
  );
}
