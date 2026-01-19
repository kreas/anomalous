/**
 * Evidence type-specific formatting for display
 * Implements US-2.5: Evidence Type Behaviors
 */

import type { Evidence } from "@/types";

/**
 * Format evidence content based on type
 */
export function formatEvidenceContent(evidence: Evidence): string {
  const formatter = evidenceFormatters[evidence.type];
  if (formatter) {
    return formatter(evidence);
  }
  return evidence.content || "[No content]";
}

/**
 * Type-specific formatters
 */
const evidenceFormatters: Record<string, (evidence: Evidence) => string> = {
  chat_log: formatChatLog,
  data_fragment: formatDataFragment,
  testimony: formatTestimony,
  access_key: formatAccessKey,
  tool: formatTool,
  coordinates: formatCoordinates,
};

/**
 * Format chat log as IRC-style conversation
 */
function formatChatLog(evidence: Evidence): string {
  if (!evidence.content) return "[Empty chat log]";

  const lines = [
    `--- CHAT LOG: ${evidence.name} ---`,
    evidence.content,
    "--- END LOG ---",
  ];

  return lines.join("\n");
}

/**
 * Format data fragment with corruption effects
 */
function formatDataFragment(evidence: Evidence): string {
  if (!evidence.content) return "[Corrupted - no data recovered]";

  const corruptionLevel = evidence.metadata?.corruptionLevel as number ?? 0.3;
  const corrupted = applyCorruption(evidence.content, corruptionLevel);

  const lines = [
    `--- DATA FRAGMENT: ${evidence.name} ---`,
    corrupted,
    "--- END FRAGMENT ---",
  ];

  return lines.join("\n");
}

/**
 * Format testimony as a quoted statement
 */
function formatTestimony(evidence: Evidence): string {
  if (!evidence.content) return "[No testimony recorded]";

  const witness = evidence.metadata?.witness as string || "Unknown";

  const lines = [
    `--- TESTIMONY ---`,
    `Witness: ${witness}`,
    "",
    `"${evidence.content}"`,
    "--- END TESTIMONY ---",
  ];

  return lines.join("\n");
}

/**
 * Format access key with unlock information
 */
function formatAccessKey(evidence: Evidence): string {
  if (!evidence.content) return "[Invalid access key]";

  const unlocks = evidence.metadata?.unlocks as string || "Unknown";

  const lines = [
    `--- ACCESS KEY ---`,
    `Key: ${evidence.content}`,
    `Unlocks: ${unlocks}`,
    "--- END KEY ---",
  ];

  return lines.join("\n");
}

/**
 * Format tool with command information
 */
function formatTool(evidence: Evidence): string {
  const command = evidence.metadata?.command as string || "";
  const description = evidence.content || evidence.description;

  const lines = [
    `--- TOOL: ${evidence.name} ---`,
    description,
  ];

  if (command) {
    lines.push("");
    lines.push(`Command: ${command}`);
  }

  lines.push("--- END TOOL ---");

  return lines.join("\n");
}

/**
 * Format coordinates with location pointer
 */
function formatCoordinates(evidence: Evidence): string {
  if (!evidence.content) return "[Invalid coordinates]";

  const target = evidence.metadata?.target as string || evidence.content;

  const lines = [
    `--- COORDINATES ---`,
    `Location: ${target}`,
    "",
    evidence.content,
    "--- END COORDINATES ---",
  ];

  return lines.join("\n");
}

/**
 * Apply corruption effect to text
 * Replaces random characters with unicode block characters
 */
function applyCorruption(text: string, level: number): string {
  const corruptionChars = ["█", "▓", "▒", "░", "▄", "▀", "■"];

  return text
    .split("")
    .map((char) => {
      // Don't corrupt newlines or spaces
      if (char === "\n" || char === " ") return char;

      // Random chance based on corruption level
      if (Math.random() < level) {
        return corruptionChars[Math.floor(Math.random() * corruptionChars.length)];
      }
      return char;
    })
    .join("");
}

/**
 * Generate a glitchy/corrupted version of a name or ID
 */
export function corruptText(text: string, intensity: number = 0.3): string {
  return applyCorruption(text, intensity);
}
