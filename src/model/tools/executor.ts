import { ToolCall } from 'ollama';
import { runBulbCommand } from '../../util/tinytuya';

/**
 * Execute a tool call requested by Ollama and return its JSON result.
 */
export async function executeTool(toolCall: ToolCall): Promise<any> {
  const name = toolCall.function.name;
  const args = toolCall.function.arguments;

  console.log(`⚙️ Agent is executing physical tool: ${name}(${JSON.stringify(args)})`);

  if (name === 'run_bulb_command') {
    try {
      const action = args.action;
      const value = args.value;
      const options = {
        json: true,
        device: args.device
      };
      
      // We pass the json: true flag to runBulbCommand so we get a structured response back for the LLM
      const result = await runBulbCommand(action, value, options);
      return result;
    } catch (e: any) {
      return { error: e.message || 'Unknown execution error' };
    }
  }
  
  return { error: `Tool ${name} not found.` };
}
