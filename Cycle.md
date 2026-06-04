// Define your specific Agent Context shape
interface CustomAgentContext extends AgentContext {
  task: string;
  loopCount?: number;
  currentTool?: string;
  finalAnswer?: string;
}

// 1. Create the lifecycle manager instance
const agentCycle = createAgentCycle<CustomAgentContext>();

// 2. Define a clean, strongly-typed Extension
const LoopGuardExtension: AgentLifecycle<CustomAgentContext> = {
  onAgentStart: (ctx) => {
    return { loopCount: 0 }; // Initialize counter safely
  },
  onThoughtStart: (ctx) => {
    const nextCount = (ctx.loopCount || 0) + 1;
    console.log(`[Cycle] Step #${nextCount} processing...`);
    
    if (nextCount > 5) {
      throw new Error("Loop limit reached: Infinite loop prevented.");
    }
    return { loopCount: nextCount }; // Mutate state along the pipeline
  }
};

// 3. Register extensions
agentCycle.register(LoopGuardExtension);

// 4. Drive your Agent loop inside the orchestration logic
async function runMyAgent(taskDescription: string) {
  let context: CustomAgentContext = { task: taskDescription };

  try {
    // Emit initialization
    context = await agentCycle.emit('onAgentStart', context);

    // Simulated ReAct Execution Loop
    for (let i = 0; i < 3; i++) {
      context = await agentCycle.emit('onThoughtStart', context);
      
      context.currentTool = "WebSearch";
      context = await agentCycle.emit('onToolStart', context);
      // ... invoke external tools ...
      context = await agentCycle.emit('onToolEnd', context);
    }

    context.finalAnswer = "Success";
    context = await agentCycle.emit('onAgentEnd', context);
    
  } catch (error) {
    await agentCycle.emit('onAgentError', { ...context, error });
    console.error("Agent execution crashed:", error);
  }
}