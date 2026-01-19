/**
 * Evidence commands - evidence inventory and examination (Phase 3)
 * All commands use API calls for server-side data access
 */

import { registerCommand } from "./registry";

/**
 * /evidence - List or examine evidence
 */
registerCommand({
  name: "evidence",
  aliases: ["ev", "inventory", "inv"],
  description: "List evidence or examine a specific piece",
  usage: "/evidence [id] [examine]",
  handler: (args) => {
    // No args - list all evidence
    if (args.length === 0) {
      return {
        success: true,
        action: "api_call",
        apiCall: {
          endpoint: "/api/evidence",
          method: "GET",
          handler: "evidence_list",
        },
      };
    }

    // Check for examine subcommand
    if (args[0].toLowerCase() === "examine" && args.length >= 2) {
      const evidenceId = args[1];
      return {
        success: true,
        action: "api_call",
        apiCall: {
          endpoint: "/api/evidence",
          method: "POST",
          body: { action: "examine", evidenceId },
          handler: "evidence_examine",
        },
      };
    }

    // View specific evidence
    const evidenceId = args[0];
    return {
      success: true,
      action: "api_call",
      apiCall: {
        endpoint: `/api/evidence?id=${encodeURIComponent(evidenceId)}`,
        method: "GET",
        handler: "evidence_detail",
      },
    };
  },
});

/**
 * /connect - Connect two pieces of evidence
 */
registerCommand({
  name: "connect",
  aliases: ["link"],
  description: "Attempt to connect two pieces of evidence",
  usage: "/connect <evidence_id_1> <evidence_id_2>",
  handler: (args) => {
    if (args.length < 2) {
      return {
        success: false,
        message: "Usage: /connect <evidence_id_1> <evidence_id_2>",
        action: "system_message",
      };
    }

    const [evidenceId1, evidenceId2] = args;

    return {
      success: true,
      action: "api_call",
      apiCall: {
        endpoint: "/api/evidence",
        method: "POST",
        body: { action: "connect", evidenceId1, evidenceId2 },
        handler: "evidence_connect",
      },
    };
  },
});
