import type { ModelMessage } from "ai";
import type { ToolCallInfo } from "./tool.type";

export interface AgentContext {
  messages: ModelMessage[];
  toolCalls: ToolCallInfo[];
  [key: string]: any;
}

export type AgentMessages = {
  messages: ModelMessage[];
  prompt?: never;
};
