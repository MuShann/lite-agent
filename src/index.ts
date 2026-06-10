import { createAgentCycle } from "./agent/cycle/createAgentCycle";
import { handleTools } from "./agent/tools";
import type { AgentContext } from "./types/agent.type";

const cycle = createAgentCycle({
  messages: [
    { role: "user", content: "What files are in the current directory?" },
  ],
} as AgentContext);

cycle.register(handleTools, () => ({
  onAgentStart: () => {
    console.log("Agent started");
  },
  onThoughtStart: () => {
    console.log("Thought started");
  },
  onThoughtEnd: () => {
    console.log("Thought ended");
  },
  onToolStart: () => {
    console.log("Tool started");
  },
  onToolEnd: () => {
    console.log("Tool ended");
  },
  onAgentEnd: () => {
    console.log("Agent ended");
  },
}));

await cycle.run();
