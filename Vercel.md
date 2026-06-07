start
start-step
reasoning-start
reasoning-delta
reasoning-end
text-start
text-delta
tool-input-start
tool-input-delta
tool-input-end
tool-call
tool-result
text-end
finish-step
finish

import { streamText, type LanguageModel } from 'ai';

export function createAgentCycle<T extends AgentContext = AgentContext>(): AgentCycleManager<T> {
  const registry = createRegistry<T>();

  // ... register and emit implementations remain the same

  /**
   * Orchestrates the full Agent Execution Loop by consuming Vercel AI SDK's chunk stream
   * @param context Initial input context
   * @param model Vercel AI SDK Model Instance (e.g., openai('gpt-4o') or google('gemini-2.0-flash'))
   * @param tools Your tools definition object required by Vercel AI SDK
   */
  const run = async (
    context: T,
    model: LanguageModel,
    tools: Record<string, any>
  ): Promise<T> => {
    let currentContext = { ...context };

    try {
      // 1. Trigger Global Initialization
      currentContext = await emit("onAgentStart", currentContext);

      // 2. Call Vercel AI SDK with auto-tool execution enabled
      const result = await streamText({
        model,
        prompt: currentContext.task,
        tools,
        // Optional: you can pass maxSteps to prevent infinite tool loops
        maxSteps: 10, 
      });

      // 3. Consume the stream chunk by chunk and bridge them to your lifecycles
      for await (const chunk of result.fullStream) {
        switch (chunk.type) {
          
          case 'start-step':
            // A new reasoning/action loop layer begins
            currentContext = await emit("onThoughtStart", currentContext);
            break;

          case 'tool-call':
            // The model officially requested a tool execution (Before it actually runs)
            // We inject the current tool details into context for extensions to inspect
            currentContext.currentTool = chunk.toolName;
            currentContext.toolArgs = chunk.args;
            
            currentContext = await emit("onToolStart", currentContext);
            
            // NOTE: If an extension (like Human-in-the-loop) mutated the currentNode 
            // away from the tool flow, you can handle the abort logic here if needed.
            break;

          case 'tool-result':
            // The tool has finished executing, and the result is captured
            currentContext.toolResult = chunk.result;
            currentContext = await emit("onToolEnd", currentContext);
            break;

          case 'finish-step':
            // The current step finishes. 
            // If text was generated, it's fully complete here.
            currentContext = await emit("onThoughtEnd", currentContext);
            break;

          // --- The following chunks are granular streaming deltas ---
          // You can use them for lightweight logging or telemetry, 
          // but they do not alter the main state-machine lifecycles.
          case 'reasoning-start':
            // Model starts thinking (e.g., DeepSeek R1 <think> block)
            break;
          case 'text-start':
            // Model starts talking
            break;
          case 'tool-input-start':
            // Model starts streaming tool arguments JSON
            break;
        }
      }

      // 4. Trigger Global Finalization after all steps finish successfully
      currentContext = await emit("onAgentEnd", currentContext);
      return currentContext;

    } catch (error) {
      // 5. Global Error Catching
      currentContext = await emit("onAgentError", {
        ...currentContext,
        error,
      } as T);

      // If extensions didn't explicitly flag the error as handled, bubble it up
      if (!(currentContext as any).isErrorHandled) {
        throw error;
      }

      return currentContext;
    }
  };

  return {
    register,
    emit,
    run,
  };
}