import { ToolCall } from 'ollama';
import { runBulbCommand } from '../../util/tinytuya';
import {
  addAutomation,
  listAutomations,
  removeAutomation,
  secondsToCron,
  signalReload
} from '../../util/automation-manager';

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

  if (name === 'list_automations') {
    try {
      const automations = listAutomations();
      if (automations.length === 0) {
        return { automations: [], message: 'No automations found.' };
      }
      return {
        automations: automations.map(a => ({
          id: a.id,
          name: a.name,
          cron: a.cron,
          enabled: a.enabled,
          actions: a.actions.map(act => `${act.tool}(${JSON.stringify(act.arguments)})`)
        })),
        total: automations.length
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error listing automations';
      return { error: message };
    }
  }

  if (name === 'remove_automation') {
    try {
      const targetId = args.id as string | undefined;
      const targetName = args.name as string | undefined;

      if (!targetId && !targetName) {
        return { error: 'Either id or name is required to remove an automation.' };
      }

      // If name is provided but not id, find the automation by name
      let resolvedId = targetId;
      if (!resolvedId && targetName) {
        const automations = listAutomations();
        const match = automations.find(
          a => a.name.toLowerCase() === targetName.toLowerCase()
        );
        if (!match) {
          return { error: `No automation found with name "${targetName}".` };
        }
        resolvedId = match.id;
      }

      const removed = removeAutomation(resolvedId!);
      if (!removed) {
        return { error: `No automation found with ID "${resolvedId}".` };
      }

      // Signal the running scheduler to pick up the change
      const reloaded = signalReload();

      return {
        success: true,
        removedId: resolvedId,
        schedulerReloaded: reloaded
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error removing automation';
      return { error: message };
    }
  }
  
  return { error: `Tool ${name} not found.` };
}
