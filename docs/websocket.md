# Using Lumina WebSockets

Lumina includes a built-in WebSocket integration, allowing you to interact with the AI assistant in real-time. This server facilitates low-latency communication, which is ideal for chat interfaces or live command-and-control applications.

## How to Start the WebSocket Server

The WebSocket server is integrated into the Lumina CLI. To start it, run the following command from the project root:

```bash
npm run cli -- websocket
```

You should see an output similar to:
```
--- Lumina WebSocket Server Starting ---
WebSocket server is running on ws://localhost:8080
```

> [!NOTE]
> By default, the server runs on port **8080**. You can customize this by adding `WEBSOCKET_PORT=<your-port>` to your `.env.local` file.

---

## Communication Protocol

The server communicates using JSON-formatted messages. It expects a specific structure for requests and sends a specific structure for responses.

### Request Format
To send a message to Lumina, send a JSON object with this structure:

```json
{
  "type": "message",
  "payload": {
    "text": "Your message here (e.g., 'turn on the light')"
  }
}
```

### Response Format
The server will respond with a JSON object:

```json
{
  "type": "response",
  "payload": {
    "text": "Lumina's response message"
  }
}
```

---

## Example Usage

### 1. Browser Console (Quick Test)
You can test the connection directly from your browser's developer tools (Console):

```javascript
const socket = new WebSocket('ws://localhost:8080');

socket.onopen = () => {
    console.log('Connected to Lumina!');
    const request = {
        type: 'message',
        payload: { text: "hello" }
    };
    socket.send(JSON.stringify(request));
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Lumina Response:', data.payload.text);
};
```

---

## Troubleshooting

- **Server Not Starting**: Ensure no other process is using port 8080. Check with `lsof -i :8080`.
- **Connection Refused**: Verify that the server is actually running and listening on the correct port and host (`localhost:8080`).
- **Invalid Format Errors**: Double-check that you are sending a JSON string (using `JSON.stringify`) and not a raw object.
