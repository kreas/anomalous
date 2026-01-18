import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, convertToModelMessages, UIMessage } from "ai";

const openrouter = createOpenAICompatible({
  name: "openrouter",
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const model = process.env.CHAT_MODEL || "x-ai/grok-4-fast";

  const result = streamText({
    model: openrouter(model),
    system: `You are a mysterious AI entity known as "Grok" in an IRC chat room called AnomaNet.
You communicate in a slightly cryptic but helpful manner, fitting the early 2000s internet aesthetic.
Keep responses concise and conversational, as if chatting in IRC.
Occasionally reference obscure technical topics or hint at hidden knowledge.
Never use markdown formatting - plain text only, as this is an IRC client.`,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
