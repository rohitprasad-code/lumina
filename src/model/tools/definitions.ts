import { Tool } from 'ollama';

/**
 * Define the tool schemas that Ollama uses to understand 
 * what actions it can take on the physical bulb.
 */
export const bulbTools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'run_bulb_command',
      description: 'Control a smart bulb or light strip. You can turn them on/off, toggle state, adjust brightness, or change colors.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'The specific hardware action to perform: "on", "off", "toggle", "status", "brightness", "color"',
            enum: ['on', 'off', 'toggle', 'status', 'brightness', 'color']
          },
          value: {
            type: 'string',
            description: 'The value for the action, if applicable. For brightness: a number "1" to "100". For color: a 6-character hex code without the hashtag, like "FF0000" for red.'
          },
          device: {
            type: 'string',
            description: 'The specific name or ID of the device to control. Omit to target the default/all devices.'
          }
        },
        required: ['action']
      }
    }
  }
];

/**
 * Tool schema for creating scheduled automations (cron jobs) via natural language.
 */
export const schedulingTools: Tool[] = [
  {
    type: 'function',
    function: {
      name: 'schedule_automation',
      description: 'Create a new scheduled automation (cron job) that repeats a smart home action at a given interval. Use this when the user asks to schedule, repeat, or automate a device action on a timer.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            description: 'The device action to schedule: "on", "off", or "toggle".',
            enum: ['on', 'off', 'toggle']
          },
          interval_seconds: {
            type: 'number',
            description: 'How often to repeat the action, in seconds. For example, 30 means every 30 seconds, 300 means every 5 minutes, 3600 means every hour. Use this for simple repeating intervals.'
          },
          cron_expression: {
            type: 'string',
            description: 'A cron expression for advanced/specific schedules (6-field format: second minute hour dayOfMonth month dayOfWeek). Only use this if interval_seconds is not sufficient, e.g. "0 0 18 * * *" for every day at 6 PM.'
          },
          name: {
            type: 'string',
            description: 'A short, friendly name for this automation, e.g. "Evening lights off".'
          }
        },
        required: ['action']
      }
    }
  }
];

/**
 * Combined set of all tools available to the agent.
 */
export const allTools: Tool[] = [...bulbTools, ...schedulingTools];
