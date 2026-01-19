import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, convertToModelMessages, UIMessage } from "ai";
import { DEV_USER_ID, ANONYMOUS_ENTITY_ID } from "@/lib/constants";
import { getOrCreateAnonymousCard } from "@/lib/entities";
import {
  getOrCreateRelationshipState,
  saveRelationshipState,
} from "@/lib/relationships";
import { generateSystemPrompt } from "@/lib/prompts";

const openrouter = createOpenAICompatible({
  name: "openrouter",
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const FALLBACK_PROMPT = `You are a mysterious AI entity known as "Anonymous" in an IRC chat room called AnomaNet.
You communicate in a slightly cryptic but helpful manner, fitting the early 2000s internet aesthetic.
Keep responses concise and conversational, as if chatting in IRC.
Occasionally reference obscure technical topics or hint at hidden knowledge.
Never use markdown formatting - plain text only, as this is an IRC client.`;

interface ChatRequest {
  messages: UIMessage[];
  channelId?: string; // Optional: indicates which channel/query the conversation is in
  isPrivate?: boolean; // Optional: indicates if this is a private conversation
}

export async function POST(req: Request) {
  const { messages, channelId, isPrivate }: ChatRequest = await req.json();
  const model = process.env.CHAT_MODEL || "x-ai/grok-4-fast";
  const userId = DEV_USER_ID;

  let systemPrompt = FALLBACK_PROMPT;

  try {
    // Load entity card and relationship state from R2
    const [card, relationship] = await Promise.all([
      getOrCreateAnonymousCard(userId),
      getOrCreateRelationshipState(userId, ANONYMOUS_ENTITY_ID),
    ]);

    // Generate dynamic system prompt
    systemPrompt = generateSystemPrompt(card, relationship, "Player");

    // Add private conversation context if applicable
    if (isPrivate || channelId?.startsWith("query-")) {
      systemPrompt += `\n\n[CONTEXT: This is a private, one-on-one conversation. You can be more personal and intimate here than in public channels. The player has chosen to speak with you directly.]`;
    }

    // Update interaction timestamp (fire and forget for streaming)
    const updatedState = {
      ...relationship,
      last_interaction: new Date().toISOString(),
      total_interactions: relationship.total_interactions + 1,
    };
    saveRelationshipState(userId, ANONYMOUS_ENTITY_ID, updatedState).catch(
      (err) => console.error("Failed to update relationship state:", err),
    );
  } catch (error) {
    console.error("Failed to load entity data, using fallback:", error);
  }

  const result = streamText({
    model: openrouter(model),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
