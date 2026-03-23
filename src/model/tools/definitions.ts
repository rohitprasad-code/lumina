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
