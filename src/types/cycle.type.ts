import type { AgentContext } from "./agent.type";

export type AgentCycleHook<T extends AgentContext = AgentContext> = (
  context: T,
) => void | Promise<void>;

export const agentCycleStages = [
  "onAgentStart",
  "onThoughtStart",
  "onThoughtEnd",
  "onToolStart",
  "onToolEnd",
  "onAgentEnd",
  "onAgentError",
] as const;

export type AgentCycleStage = (typeof agentCycleStages)[number];

export type AgentCycle<T extends AgentContext = AgentContext> = Partial<
  Record<AgentCycleStage, AgentCycleHook<T>>
>;

export type AgentCycleEvent<T extends AgentContext = AgentContext> =
  () => AgentCycle<T>;

export interface AgentCycleManager<T extends AgentContext = AgentContext> {
  register: (...events: AgentCycleEvent<T>[]) => void;
  emit: (stage: AgentCycleStage) => Promise<void>;
  run: () => Promise<void>;
}
