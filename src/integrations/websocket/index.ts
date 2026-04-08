import { WebSocketServer, WebSocket } from 'ws';
import { handleMessage } from '../router';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const DEFAULT_PORT = 8080;
const PORT = process.env.WEBSOCKET_PORT ? parseInt(process.env.WEBSOCKET_PORT) : DEFAULT_PORT;

interface WSRequest {
  type: 'message';
  payload: {
    text: string;
  };
}

interface WSResponse {
  type: 'response';
  payload: {
    text: string;
  };
}

/**
 * Starts the WebSocket server listener
 */
export async function startWebSocketServer() {
  const wss = new WebSocketServer({ port: PORT });

  wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket] New client connected');

    ws.on('message', async (data: string) => {
      try {
        const message = JSON.parse(data.toString()) as WSRequest;

        if (message.type === 'message' && message.payload?.text) {
          const input = message.payload.text;
          console.log(`[WebSocket] Received message: ${input}`);

          // Process message through the router
          const responseText = await handleMessage(input);

          const response: WSResponse = {
            type: 'response',
            payload: {
              text: responseText
            }
          };

          ws.send(JSON.stringify(response));
        } else {
          console.warn('[WebSocket] Received unknown message type or invalid format');
          ws.send(JSON.stringify({
            type: 'error',
            payload: {
              text: 'Invalid message format. Expected: { "type": "message", "payload": { "text": "..." } }'
            }
          }));
        }
      } catch (error) {
        console.error('[WebSocket] Error processing message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          payload: {
            text: 'Internal server error'
          }
        }));
      }
    });

    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected');
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Connection error:', error);
    });
  });

  console.log('--- Lumina WebSocket Server Starting ---');
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);

  // Enable graceful stop
  process.once('SIGINT', () => {
    console.log('\n[WebSocket] Shutting down server...');
    wss.close();
  });
  process.once('SIGTERM', () => {
    console.log('\n[WebSocket] Shutting down server...');
    wss.close();
  });
}
