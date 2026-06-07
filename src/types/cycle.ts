import type { AgentContext } from "./agent";

export type AgentCycleHook<T extends AgentContext = AgentContext> = (context: T) => void | Partial<T> | Promise<void | Partial<T>>;

export const agentCycleStages = ["onAgentStart", "onThoughtStart", "onThoughtEnd", "onToolStart", "onToolEnd", "onAgentEnd", "onAgentError"] as const;

export type AgentCycleStage = (typeof agentCycleStages)[number];

export type AgentCycle<T extends AgentContext = AgentContext> = Partial<Record<AgentCycleStage, AgentCycleHook<T>>>;

export type AgentCycleEvent<T extends AgentContext = AgentContext> = () => AgentCycle<T>;

export interface AgentCycleManager<T extends AgentContext = AgentContext> {
  register: (...events: AgentCycleEvent<T>[]) => void;
  emit: (stage: AgentCycleStage, context: T) => Promise<T>;
  run: (context: T) => Promise<T>;
}
