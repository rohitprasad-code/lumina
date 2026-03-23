import ollama, { Message as OllamaMessage } from 'ollama';

export type { OllamaMessage };

export async function chatCompletion(messages: OllamaMessage[], model: string = 'llama3.2'): Promise<string> {
  try {
    const response = await ollama.chat({
      model,
      messages,
      stream: false
    });

    return response.message.content;
  } catch (error) {
    console.error('Failed to communicate with Ollama API:', error);
    throw error;
  }
}
