/**
 * Case commands - investigation case management (Phase 3)
 * All commands use API calls for server-side data access
 */

import { registerCommand } from "./registry";

/**
 * /accept - Accept a case from #mysteries
 */
registerCommand({
  name: "accept",
  aliases: ["take"],
  description: "Accept a case from #mysteries",
  usage: "/accept <case_id>",
  handler: (args) => {
    if (args.length === 0) {
      return {
        success: false,
        message: "Usage: /accept <case_id>",
        action: "system_message",
      };
    }

    const caseId = args[0];

    return {
      success: true,
      action: "api_call",
      apiCall: {
        endpoint: "/api/cases",
        method: "POST",
        body: { action: "accept", caseId },
        handler: "case_accept",
      },
    };
  },
});

/**
 * /cases - List active cases
 */
registerCommand({
  name: "cases",
  aliases: ["mycases", "active"],
  description: "List your active cases",
  usage: "/cases",
  handler: () => {
    return {
      success: true,
      action: "api_call",
      apiCall: {
        endpoint: "/api/cases?type=active",
        method: "GET",
        handler: "case_list",
      },
    };
  },
});

/**
 * /case - Show case details
 */
registerCommand({
  name: "case",
  aliases: ["caseinfo"],
  description: "Show details for a specific case",
  usage: "/case <case_id>",
  handler: (args) => {
    if (args.length === 0) {
      return {
        success: false,
        message: "Usage: /case <case_id>",
        action: "system_message",
      };
    }

    const caseId = args[0];

    return {
      success: true,
      action: "api_call",
      apiCall: {
        endpoint: `/api/cases?id=${encodeURIComponent(caseId)}`,
        method: "GET",
        handler: "case_detail",
      },
    };
  },
});

/**
 * /abandon - Abandon an active case
 */
registerCommand({
  name: "abandon",
  aliases: ["drop", "giveup"],
  description: "Abandon an active case",
  usage: "/abandon <case_id>",
  handler: (args) => {
    if (args.length === 0) {
      return {
        success: false,
        message: "Usage: /abandon <case_id>",
        action: "system_message",
      };
    }

    const caseId = args[0];

    return {
      success: true,
      action: "api_call",
      apiCall: {
        endpoint: "/api/cases",
        method: "POST",
        body: { action: "abandon", caseId },
        handler: "case_abandon",
      },
    };
  },
});

/**
 * /mysteries - Show available cases (shortcut to viewing #mysteries content)
 */
registerCommand({
  name: "mysteries",
  aliases: ["available"],
  description: "Show available cases from #mysteries",
  usage: "/mysteries",
  handler: () => {
    return {
      success: true,
      action: "api_call",
      apiCall: {
        endpoint: "/api/cases?type=available",
        method: "GET",
        handler: "case_available",
      },
    };
  },
});

/**
 * /solve - Attempt to solve a case
 */
registerCommand({
  name: "solve",
  aliases: ["resolve"],
  description: "Attempt to solve an active case",
  usage: "/solve <case_id> [theory]",
  handler: (args) => {
    if (args.length === 0) {
      return {
        success: false,
        message:
          "Usage: /solve <case_id> [theory]\nProvide your theory of what happened.",
        action: "system_message",
      };
    }

    const caseId = args[0];
    const theory = args.slice(1).join(" ");

    return {
      success: true,
      action: "api_call",
      apiCall: {
        endpoint: "/api/cases",
        method: "POST",
        body: { action: "solve", caseId, theory: theory || undefined },
        handler: "case_solve",
      },
    };
  },
});
