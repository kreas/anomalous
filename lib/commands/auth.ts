/**
 * Authentication commands
 */

import { registerCommand } from "./registry";

/**
 * /logout - Sign out of the current session
 */
registerCommand({
  name: "logout",
  aliases: ["signout", "disconnect"],
  description: "Sign out of AnomaNet",
  usage: "/logout",
  handler: () => {
    return {
      success: true,
      action: "api_call",
      apiCall: {
        endpoint: "/api/auth/signout",
        method: "POST",
        handler: "auth_signout",
      },
      message: "Disconnecting from AnomaNet...",
    };
  },
});

/**
 * /whoami - Display current user info
 */
registerCommand({
  name: "whoami",
  aliases: ["profile"],
  description: "Display your profile information",
  usage: "/whoami",
  handler: () => {
    return {
      success: true,
      action: "api_call",
      apiCall: {
        endpoint: "/api/profile",
        method: "GET",
        handler: "auth_whoami",
      },
    };
  },
});
