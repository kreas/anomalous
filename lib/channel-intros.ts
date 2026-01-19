/**
 * Channel introduction messages displayed on first load
 */

import type { ChannelType } from "@/types";

/**
 * Intro messages for each channel type
 */
export const CHANNEL_INTROS: Record<ChannelType, string> = {
  lobby: "Connected to AnomaNet. Welcome to #lobby.",
  mysteries: "Active cases displayed below. Use /accept <case_id> to take a case.",
  "tech-support": "Type /help for available commands.",
  "off-topic": "Casual chat. Be nice.",
  signals: "SIGNAL RECEIVER READY. Use /signal to pull.",
  archives: "ARCHIVE ACCESS GRANTED. Use /search to query.",
  private: "Private communications channel.",
  redacted: "[DATA EXPUNGED]",
  query: "", // Query windows don't have an intro - they're for private conversations
};

/**
 * Get the intro message for a channel type
 */
export function getChannelIntro(type: ChannelType): string {
  return CHANNEL_INTROS[type] || "";
}

/**
 * Topic/description messages for channels (shown in status bar or header)
 */
export const CHANNEL_TOPICS: Record<ChannelType, string> = {
  lobby: "Main gathering place | All users welcome",
  mysteries: "Active investigations | Type /cases to list",
  "tech-support": "Help & documentation | /help for commands",
  "off-topic": "Casual discussion | Keep it friendly",
  signals: "Evidence acquisition | /signal to pull",
  archives: "Historical records | /search <query>",
  private: "Encrypted channel",
  redacted: "???",
  query: "Private conversation",
};

/**
 * Get the topic for a channel type
 */
export function getChannelTopic(type: ChannelType): string {
  return CHANNEL_TOPICS[type] || "";
}
