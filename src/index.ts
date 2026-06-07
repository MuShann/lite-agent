import { streamText, tool } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import z from "zod";

const apiKey = process.env.LLM_API_KEY;

if (!apiKey) {
  throw new Error("Missing LLM_API_KEY in .env");
}

const provider = createOpenAICompatible({
  name: 'deepseek',
  apiKey,
  baseURL: process.env.LLM_BASE_URL as string,
});

const result = await streamText({
  model: provider.chatModel(process.env.LLM_MODEL ?? "deepseek-v4-flash-free"),
  prompt: "请先思考北京明天的天气是否适合户外运动，然后调用 get_weather 工具查询北京天气。",
  tools: {
    get_weather: tool({
      description: '获取指定位置的天气',
      inputSchema: z.object({ location: z.string().describe('位置名称，例如：北京') }),
      execute: async ({ location }) => ({ weather: '晴', temperature: '22°C', location }),
    }),
  }
});

for await (const chunk of result.fullStream) {
  console.log(JSON.stringify(chunk));
}
