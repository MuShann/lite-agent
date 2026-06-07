import type { AgentContext } from "../../types/agent";
import { agentCycleStages, type AgentCycleEvent, type AgentCycleHook, type AgentCycleManager, type AgentCycleStage } from "../../types/cycle";

type AgentCycleRegistry<T extends AgentContext> = Record<AgentCycleStage, AgentCycleHook<T>[]>;

const createRegistry = <T extends AgentContext>(): AgentCycleRegistry<T> => {
  return agentCycleStages.reduce((registry, stage) => {
    registry[stage] = [];
    return registry;
  }, {} as AgentCycleRegistry<T>);
};

export function createAgentCycle<T extends AgentContext = AgentContext>(): AgentCycleManager<T> {
  const registry = createRegistry<T>();

  const register = (...events: AgentCycleEvent<T>[]) => {
    events.forEach((event) => {
      const eventFunction = event();

      agentCycleStages.forEach((stage) => {
        const hook = eventFunction[stage];
        if (typeof hook === "function") {
          registry[stage].push(hook);
        }
      });
    });
  };

  const emit = async (stage: AgentCycleStage, context: T): Promise<T> => {
    let currentContext = { ...context };

    for (const hook of registry[stage]) {
      const updatedContext = await hook(currentContext);
      if (updatedContext) {
        currentContext = structuredClone({ ...currentContext, ...updatedContext });
      }
    }

    return currentContext;
  };

  const run = async (context: T): Promise<T> => {
    let currentContext = { ...context };
 
    try {
      currentContext = await emit("onAgentStart", currentContext);

      
    } catch (error) {
      return emit("onAgentError", {
        ...currentContext,
        error,
      } as T);
    }
  };

  return {
    register,
    emit,
    run,
  };
}
