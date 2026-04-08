import { AgentLoop } from '../agent';

/**
 * Message Router
 * Routes messages from CLI, Telegram, WhatsApp, etc. to the AI Agent.
 * Each user gets their own isolated AgentLoop so conversation history
 * is never shared across users.
 */

const agents = new Map<string, AgentLoop>();

/**
 * Returns the AgentLoop for a given user, creating one if it doesn't exist.
 */
function getAgentForUser(userId: string): AgentLoop {
  if (!agents.has(userId)) {
    agents.set(userId, new AgentLoop());
  }
  return agents.get(userId)!;
}

/**
 * Handles an incoming message for a specific user and returns the assistant's response.
 * @param input   The text message from the user
 * @param userId  A unique identifier for the user (Telegram ID, WhatsApp JID, 'cli', etc.)
 * @returns The assistant's textual response
 */
export async function handleMessage(input: string, userId: string = 'cli'): Promise<string> {
  try {
    const agent = getAgentForUser(userId);
    const response = await agent.processUserInput(input);
    return response;
  } catch (error) {
    console.error('Router Error:', error);
    return 'Sorry, I encountered an error processing your request.';
  }
}
