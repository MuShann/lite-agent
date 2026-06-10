import { streamText } from "ai";
import type { AgentMessages } from "../../types/agent.type";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { SYSTEM_PROMPT } from "../system/prompt";
import { toolDefinitions } from "../tools";

type StreamTextOptions = Omit<
  Parameters<typeof streamText>[0],
  "model" | "prompt" | "tools"
> &
  AgentMessages;
type StreamTextReturn = ReturnType<typeof streamText>;

export function createStreamText(options: StreamTextOptions): StreamTextReturn {
  const apiKey = process.env.LLM_API_KEY;
  const baseURL = process.env.LLM_BASE_URL;

  if (!apiKey) {
    throw new Error("LLM_API_KEY is not defined in environment variables.");
  }

  if (!baseURL) {
    throw new Error("LLM_BASE_URL is not defined in environment variables.");
  }

  const provider = createOpenAICompatible({
    name: "lite-agent",
    apiKey,
    baseURL,
  });

  return streamText({
    model: provider.chatModel(
      process.env.LLM_MODEL ?? "deepseek-v4-flash-free",
    ),
    instructions: SYSTEM_PROMPT,
    tools: toolDefinitions,
    ...options,
  });
}
