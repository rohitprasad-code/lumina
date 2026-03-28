import { ToolCall } from 'ollama';
import { runBulbCommand } from '../../util/tinytuya';
import { addAutomation, secondsToCron, signalReload } from '../../util/automation-manager';

/**
 * Execute a tool call requested by Ollama and return its JSON result.
 */
export async function executeTool(toolCall: ToolCall): Promise<unknown> {
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
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown execution error';
      return { error: message };
    }
  }

  if (name === 'schedule_automation') {
    try {
      const action = args.action as string;
      const intervalSeconds = args.interval_seconds as number | undefined;
      const cronExpression = args.cron_expression as string | undefined;
      const friendlyName = (args.name as string | undefined) || `Auto: ${action}`;

      // Determine the cron expression
      let cron: string;
      if (cronExpression) {
        cron = cronExpression;
      } else if (intervalSeconds && intervalSeconds > 0) {
        cron = secondsToCron(intervalSeconds);
      } else {
        return { error: 'Either interval_seconds or cron_expression is required.' };
      }

      const id = `auto-${Date.now()}`;
      const automation = {
        id,
        name: friendlyName,
        cron,
        enabled: true,
        actions: [
          {
            tool: 'run_bulb_command',
            arguments: { action }
          }
        ]
      };

      addAutomation(automation);

      // Signal the running scheduler to pick up the new automation
      const reloaded = signalReload();

      return {
        success: true,
        automation: {
          id,
          name: friendlyName,
          cron,
          schedulerReloaded: reloaded
        }
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error creating automation';
      return { error: message };
    }
  }
  
  return { error: `Tool ${name} not found.` };
}
