/**
 * Generic Context constraints.
 * Allows the context to be dynamically extended by various lifecycles.
 */
export interface AgentContext {
  task: string;
  [key: string]: any;
};

/**
 * Type definition for a life cycle Hook function.
 * Accepts a context, performs side effects, and optionally returns a partial update to the context.
 */
export type AgentCycleHook<T extends AgentContext = AgentContext> = (
  context: T
) => void | Partial<T> | Promise<void | Partial<T>>;

/**
 * The standard life cycle stages for an agent execution loop.
 */
export interface AgentCycle<T extends AgentContext = AgentContext> {
  onAgentStart?: AgentCycleHook<T>;    // Triggered when the agent initializes
  onThoughtStart?: AgentCycleHook<T>;  // Triggered before each reasoning step
  onToolStart?: AgentCycleHook<T>;     // Triggered before executing a tool
  onToolEnd?: AgentCycleHook<T>;       // Triggered after a tool finishes
  onAgentEnd?: AgentCycleHook<T>;      // Triggered when the final answer is achieved
  onAgentError?: AgentCycleHook<T>;    // Triggered when an unhandled exception occurs
};
