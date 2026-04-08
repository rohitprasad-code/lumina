import ollama, { Message as OllamaMessage, ToolCall } from 'ollama';
import { allTools } from './model/tools/definitions';
import { executeTool } from './model/tools/executor';

import ora from 'ora';

const DEFAULT_SYSTEM_PROMPT = `
You are Lumina, an intelligent assistant that controls smart home devices.
Use the provided tools to interact with physical hardware.

If the user asks you to do something with their lights, immediately use the 'run_bulb_command' tool.
Do not ask for permission, just execute the tool.
Once the tool returns a success result, give a short, friendly confirmation to the user.
If the tool returns an error, inform the user about what went wrong.

You can also manage scheduled automations:
- To CREATE a schedule: use 'schedule_automation'. Convert human intervals (e.g. "every 30 seconds") to interval_seconds. For specific times (e.g. "daily at 6pm"), use cron_expression. Always give it a descriptive name.
- To LIST/VIEW all automations: use 'list_automations'. Present results in a readable format showing ID, name, schedule, and status. Always include the ID so the user can reference it for removal.
- To REMOVE/DELETE an automation: use 'remove_automation'. You can match by ID or name. If the user refers to an automation by name, first call list_automations to find the exact ID, then remove it.
After any automation action, confirm what happened.
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
        tools: allTools,
        stream: true
      });

      let fullContent = '';
      let isTyping = false;
      const finalToolCalls: ToolCall[] = [];
      const spinner = ora('Lumina is thinking...').start();

      for await (const chunk of response) {
        if (spinner.isSpinning) {
          spinner.stop();
        }

        if (chunk.message.content) {
          if (!isTyping) {
            process.stdout.write('\n> Lumina: ');
            isTyping = true;
          }
          process.stdout.write(chunk.message.content);
          fullContent += chunk.message.content;
        }

        if (chunk.message.tool_calls && chunk.message.tool_calls.length > 0) {
          chunk.message.tool_calls.forEach(tc => finalToolCalls.push(tc));
        }
      }

      if (isTyping) {
        console.log(); // Complete the printed line
      } else if (spinner.isSpinning) {
        // In case it finished without printing text (just tool calls)
        spinner.stop();
      }

      // Reconstruct the message
      const msg: OllamaMessage & { tool_calls?: ToolCall[] } = {
        role: 'assistant',
        content: fullContent
      };
      
      if (finalToolCalls.length > 0) {
        msg.tool_calls = finalToolCalls;
      }
      
      this.messages.push(msg);

      // If there are tool calls, execute them all in parallel and collect results
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        const toolResults = await Promise.all(
          msg.tool_calls.map(tool => executeTool(tool))
        );

        for (const result of toolResults) {
          this.messages.push({
            role: 'tool',
            content: JSON.stringify(result)
          });
        }

        return await this.runLoop(); // Recurse to get the final textual response
      }

      // Return the final text content
      return fullContent || 'Action completed.';
    } catch (e: any) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('\nLumina Error:', message);
      return `Error: ${message || 'An unexpected error occurred.'}`;
    }
  }
}
