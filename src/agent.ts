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

You can also create scheduled automations. If the user asks to schedule, repeat, or automate an action (e.g. "schedule toggle every 30 seconds", "turn off lights every day at 6pm"), use the 'schedule_automation' tool.
- For simple repeating intervals like "every 30 seconds" or "every 5 minutes", convert to seconds and pass interval_seconds.
- For specific times like "every day at 6pm", use a 6-field cron expression in cron_expression.
- Always give the automation a short, descriptive name.
After creating the schedule, confirm what was created and how often it will run.
`;

export class AgentLoop {
  private messages: OllamaMessage[] = [];
  
  constructor() {
    this.messages.push({
      role: 'system',
      content: DEFAULT_SYSTEM_PROMPT.trim()
    });
  }

  public async processUserInput(input: string): Promise<void> {
    this.messages.push({ role: 'user', content: input });
    await this.runLoop();
  }

  /**
   * The core agentic loop: query model -> run requested tools -> report tool results -> query model again
   */
  private async runLoop(): Promise<void> {
    const spinner = ora().start();

    try {
      const responseStream = await ollama.chat({
        model: 'qwen3.5:latest',
        messages: this.messages,
        tools: allTools,
        stream: true
      });

      let fullContent = '';
      let isTyping = false;
      const finalToolCalls: ToolCall[] = [];

      for await (const chunk of responseStream) {
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

      if (msg.tool_calls) {
        for (const tool of msg.tool_calls) {
          const toolResult = await executeTool(tool);
          this.messages.push({
            role: 'tool',
            content: JSON.stringify(toolResult)
          });
        }
        await this.runLoop(); // Recurse
      }
    } catch (e) {
      if (spinner.isSpinning) spinner.stop();
      const message = e instanceof Error ? e.message : String(e);
      console.error('\nLumina Error:', message);
    }
  }
}
