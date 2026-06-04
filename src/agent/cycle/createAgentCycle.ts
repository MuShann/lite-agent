import type { AgentContext, AgentCycle, AgentCycleHook } from "../../types/cycle";

/**
 * Registry mapping each stage to an array of registered hook functions.
 */
type AgentCycleRegistry<T extends AgentContext> = {
  [K in keyof AgentCycle<T>]-?: AgentCycleHook<T>[];
};

/**
 * Factory function to create an agent life cycle manager instance.
 */
export function createAgentCycle<T extends AgentContext = AgentContext>() {
  // Initialize the hook registry with empty arrays for each lifecycle stage
  const registry: AgentCycleRegistry<T> = {
    onAgentStart: [],
    onThoughtStart: [],
    onToolStart: [],
    onToolEnd: [],
    onAgentEnd: [],
    onAgentError: []
  };

  /**
   * Registers a lifecycle extension (bundle of hooks) to the cycle manager.
   * Supports chaining for fluent configuration.
   * @param extension An object containing optional lifecycle hook methods.
   */
  const register = (extension: AgentCycle<T>) => {
    (Object.keys(registry) as Array<keyof AgentCycle<T>>).forEach((stage) => {
      const hook = extension[stage];
      if (typeof hook === 'function') {
        registry[stage].push(hook);
      }
    });
    return cycle; // Enables method chaining
  }

  /**
   * Dispatches and sequentially executes all registered hooks for a given lifecycle stage.
   * Allows hooks to mutate and pass down the shared context pipeline.
   * @param stage The target lifecycle stage to emit.
   * @param initialContext The baseline context before entering this stage.
   * @returns The updated context after running through the pipeline.
   */
  const emit = async (stage: keyof AgentCycle<T>, initialContext: T): Promise<T> => {
    const stageHooks = registry[stage] || [];
    let currentContext = { ...initialContext };

    for (const hook of stageHooks) {
      const updatedContext = await hook(currentContext);
      if (updatedContext) {
        currentContext = { ...currentContext, ...updatedContext };
      }
    }

    return currentContext;
  }

  const cycle = { register, emit };
  return cycle;
}