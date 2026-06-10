import type { tools } from "../agent/tools";

export type ToolName = keyof typeof tools;

export interface ToolCallInfo {
  toolCallId: string;
  toolName: ToolName;
  args: Record<string, unknown>;
}
