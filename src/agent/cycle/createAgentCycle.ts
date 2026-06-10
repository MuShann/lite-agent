import type { AgentContext } from "../../types/agent.type";
import {
  agentCycleStages,
  type AgentCycleEvent,
  type AgentCycleHook,
  type AgentCycleManager,
  type AgentCycleStage,
} from "../../types/cycle.type";
import type { ToolName } from "../../types/tool.type";
import { createStreamText } from "./createStreamText";

type AgentCycleRegistry<T extends AgentContext> = Record<
  AgentCycleStage,
  AgentCycleHook<T>[]
>;

const createRegistry = <T extends AgentContext>(): AgentCycleRegistry<T> => {
  return agentCycleStages.reduce((registry, stage) => {
    registry[stage] = [];
    return registry;
  }, {} as AgentCycleRegistry<T>);
};

export function createAgentCycle<T extends AgentContext = AgentContext>(
  initialContext: T,
): AgentCycleManager<T> {
  const registry = createRegistry<T>();
  let context = structuredClone(initialContext);

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

  const emit = async (stage: AgentCycleStage): Promise<void> => {
    const hooks = registry[stage];
    if (hooks.length === 0) return;
    await Promise.all(hooks.map((hook) => hook(context)));
  };

  const run = async (): Promise<void> => {
    while (true) {
      try {
        await emit("onAgentStart");

        const agentStreamText = createStreamText({
          messages: context.messages,
        });

        for await (const chunk of agentStreamText.stream) {
          switch (chunk.type) {
            case "reasoning-start":
              await emit("onThoughtStart");
              break;
            case "reasoning-end":
              await emit("onThoughtEnd");
              break;
            case "tool-call":
              const input = "input" in chunk ? chunk.input : {};
              context.toolCalls.push({
                toolCallId: chunk.toolCallId,
                toolName: chunk.toolName as ToolName,
                args: input as Record<string, unknown>,
              });
              break;
          }
        }

        const finishReason = await agentStreamText.finishReason;
        const responseMessages = await agentStreamText.responseMessages;
        context.messages.push(...responseMessages);

        if (finishReason === "tool-calls" && context.toolCalls.length !== 0) {
          await emit("onToolStart");
          await emit("onToolEnd");
          continue;
        }

        await emit("onAgentEnd");
        break;
      } catch (error) {
        const streamError = error as Error;
        context = { ...context, error: streamError };
        await emit("onAgentError");
        throw error;
      }
    }
  };

  return {
    register,
    emit,
    run,
  };
}
