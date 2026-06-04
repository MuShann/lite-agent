import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

const apiKey = process.env.LLM_API_KEY;

if (!apiKey) {
  throw new Error("Missing LLM_API_KEY in .env");
}

const provider = createOpenAI({
  apiKey,
  baseURL: process.env.LLM_BASE_URL,
});

const result = await generateText({
  model: provider.chat(process.env.LLM_MODEL ?? "qwen3.5-flash-2026-02-23"),
  prompt: "What is an AI agent in one sentence?",
});

console.log(result.text);
