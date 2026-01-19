/**
 * Placeholder NPC responses for Phase 2
 * Full AI-powered NPC responses will be implemented in Phase 6
 */

/**
 * Response types for NPCs
 */
export type NPCResponseType = "away" | "busy" | "scripted";

/**
 * NPC response result
 */
export interface NPCResponse {
  type: NPCResponseType;
  content: string;
  delay?: number; // Optional delay in ms before response
}

/**
 * Pool of generic "away" responses
 */
const AWAY_RESPONSES = [
  "User is away.",
  "No response.",
  "*silence*",
  "[IDLE]",
  "User appears to be offline.",
];

/**
 * Pool of generic "busy" responses
 */
const BUSY_RESPONSES = [
  "User is busy.",
  "Can't talk right now.",
  "One moment...",
  "[AFK]",
];

/**
 * Scripted responses for specific NPCs (by username)
 * These are placeholder responses until Phase 6 AI integration
 */
const SCRIPTED_RESPONSES: Record<string, string[]> = {
  // System/bot users
  AnomaBot: [
    "I am AnomaBot. Type /help for commands.",
    "Processing...",
    "Request logged.",
  ],

  // Potential future NPCs
  DataMiner: [
    "I deal in information. What are you looking for?",
    "Everything has a price.",
    "Interesting...",
  ],

  Ghost: [
    "...",
    "*static*",
    "Can you hear me?",
  ],

  Operator: [
    "System status: nominal.",
    "Please hold.",
    "Your request is being processed.",
  ],
};

/**
 * Get a random item from an array
 */
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get an NPC response based on their status and username
 */
export function getNPCResponse(
  username: string,
  status: "online" | "away" | "offline"
): NPCResponse {
  // Check for scripted responses first
  const scripted = SCRIPTED_RESPONSES[username];
  if (scripted && status === "online") {
    return {
      type: "scripted",
      content: randomChoice(scripted),
      delay: 500 + Math.random() * 1500, // 0.5-2s delay
    };
  }

  // Away or offline users
  if (status === "away" || status === "offline") {
    return {
      type: "away",
      content: randomChoice(AWAY_RESPONSES),
      delay: 200,
    };
  }

  // Online but no scripted response
  return {
    type: "busy",
    content: randomChoice(BUSY_RESPONSES),
    delay: 300 + Math.random() * 700,
  };
}

/**
 * Check if a username has scripted responses
 */
export function hasScriptedResponses(username: string): boolean {
  return username in SCRIPTED_RESPONSES;
}

/**
 * Add custom scripted responses for an NPC
 * (Useful for dynamic NPC registration in future phases)
 */
export function registerNPCResponses(
  username: string,
  responses: string[]
): void {
  SCRIPTED_RESPONSES[username] = responses;
}
