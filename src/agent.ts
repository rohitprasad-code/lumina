import ollama, { Message as OllamaMessage } from 'ollama';
import { bulbTools } from './model/tools/definitions';
import { executeTool } from './model/tools/executor';

import ora from 'ora';

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

  public async processUserInput(input: string): Promise<string> {
    this.messages.push({ role: 'user', content: input });
    return await this.runLoop();
  }

  /**
   * The core agentic loop: query model -> run requested tools -> report tool results -> query model again
   */
  private async runLoop(): Promise<string> {
    try {
      const response = await ollama.chat({
        model: 'qwen3.5:latest',
        messages: this.messages,
        tools: bulbTools,
      });

      const assistantMessage = response.message;
      this.messages.push(assistantMessage);

      // If there are tool calls, execute them and recurse
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        for (const tool of assistantMessage.tool_calls) {
          const toolResult = await executeTool(tool);
          this.messages.push({
            role: 'tool',
            content: JSON.stringify(toolResult)
          });
        }
        return await this.runLoop(); // Recurse to get the final textual response
      }

      // Return the final text content
      return assistantMessage.content || 'Action completed.';
    } catch (e: any) {
      console.error('\nLumina Error:', e.message || e);
      return `Error: ${e.message || 'An unexpected error occurred.'}`;
    }
  }
}
