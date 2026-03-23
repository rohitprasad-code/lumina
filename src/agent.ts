import ollama, { Message as OllamaMessage } from 'ollama';
import { bulbTools } from './model/tools/definitions';
import { executeTool } from './model/tools/executor';

const DEFAULT_SYSTEM_PROMPT = `
You are Lumina, an intelligent assistant that controls smart home devices.
Use the provided tools to interact with physical hardware.

If the user asks you to do something with their lights, immediately use the 'run_bulb_command' tool.
Do not ask for permission, just execute the tool.
Once the tool returns a success result, give a short, friendly confirmation to the user.
If the tool returns an error, inform the user about what went wrong.
`;

export class AgentLoop {
  private messages: OllamaMessage[] = [];
  
  constructor() {
    this.messages.push({
      role: 'system',
      content: DEFAULT_SYSTEM_PROMPT.trim()
    });
  }

  /**
   * Main entry point for processing a user's natural language input
   */
  public async processUserInput(input: string): Promise<void> {
    this.messages.push({ role: 'user', content: input });
    await this.runLoop();
  }

  /**
   * The core agentic loop: query model -> run requested tools -> report tool results -> query model again
   */
  private async runLoop(): Promise<void> {
    const response = await ollama.chat({
      model: 'qwen3.5:latest', // Target installed local model
      messages: this.messages,
      tools: bulbTools,
      stream: false
    });

    const msg = response.message;
    this.messages.push(msg);

    // If the model decides to use tools
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      for (const tool of msg.tool_calls) {
        // 1. Execute the physical bulb tool 
        const toolResult = await executeTool(tool);
        
        // 2. Append the physical outcome to conversation memory
        this.messages.push({
          role: 'tool',
          content: JSON.stringify(toolResult)
        });
      }
      
      // 3. The LLM needs a chance to review the tool output and respond to the human
      await this.runLoop();
    } else {
      // The LLM has chosen to speak to the user directly rather than using a tool (it's finished)
      if (msg.content) {
        console.log(`\nLumina: ${msg.content}`);
      }
    }
  }
}
