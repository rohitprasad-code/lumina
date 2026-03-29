import { AgentLoop } from '../agent';

/**
 * Message Router
 * Routes messages from CLI, Telegram, or WhatsApp to the AI Agent.
 */

// Simple shared agent instance for now.
// In the future, we can use a Map<string, AgentLoop> to track users.
const agent = new AgentLoop();

/**
 * Handles an incoming message and returns the assistant's response.
 * @param input The text message from the user
 * @returns The assistant's textual response
 */
export async function handleMessage(input: string): Promise<string> {
  try {
    const response = await agent.processUserInput(input);
    return response;
  } catch (error) {
    console.error('Router Error:', error);
    return 'Sorry, I encountered an error processing your request.';
  }
}