import type { AgentContext } from "../../types/agent.type";
import type { AgentCycleEvent } from "../../types/cycle.type";
import { type ToolName } from "../../types/tool.type";
import { listFiles, readFile, writeFile } from "./file.tool";

export const tools = {
  readFile,
  writeFile,
  listFiles,
};

export const toolDefinitions = Object.fromEntries(
  Object.entries(tools).map(([toolName, toolDef]) => [
    toolName,
    { ...toolDef, execute: undefined },
  ]),
);

async function executeTool(
  toolName: ToolName,
  args: Record<string, unknown>,
): Promise<string> {
  const tool = tools[toolName];

  if (!tool) {
    throw new Error(`Tool ${toolName} not found`);
  }

  const execute = tool.execute;
  if (!execute || typeof execute !== "function") {
    throw new Error(`Tool ${toolName} does not have an execute method`);
  }

  const toolResult = await execute(args as any, {
    toolCallId: "",
    messages: [],
    context: {},
  });

  return String(toolResult);
}

export const handleTools: AgentCycleEvent<AgentContext> = () => ({
  onAgentStart: (context) => {
    context.toolCalls = [];
  },
  onToolStart: async (context) => {
    for (const toolCall of context.toolCalls) {
      const toolResult = await executeTool(
        toolCall.toolName as ToolName,
        toolCall.args,
      );

      context.messages.push({
        role: "tool",
        content: [
          {
            type: "tool-result",
            toolCallId: toolCall.toolCallId,
            toolName: toolCall.toolName,
            output: { type: "text", value: toolResult },
          },
        ],
      });
    }
  },
});
