# Lumina Documentation Index

Welcome to the Lumina documentation. This guide provides an overview of all available integrations and setup instructions for each component.

## 🚀 Setup Guides

For detailed configuration and usage, choose a specific integration below:

- [**Telegram Bot**](telegram.md) — Set up and secure your AI chat bot.
- [**WebSocket Server**](websocket.md) — Enable real-time, low-latency communication.
- [**Smart Home Control**](smart-home.md) — Connect and scan for local hardware.
- [**Cron Scheduler**](cron.md) — Manage automated operations.

---

## 🏗️ Architecture Overview

Lumina is built around a central **Message Router** (`src/integrations/router.ts`) that bridges multiple entry points (CLI, Telegram, WebSocket) to a core **AI Agent loop**. This allows you to interact with your smart devices using natural language regardless of the platform.

### Core Components
- **AI Agent**: The reasoning engine using Ollama or Groq.
- **TinyTuya**: The backend bridge for local network device communication.
- **Node Cron**: The engine for background task scheduling.

---

## 🛠️ CLI Reference

A quick summary of commands available for all integrations:

| Integration | Command |
| :--- | :--- |
| **Scanner** | `npm run cli -- scan` |
| **Telegram** | `npm run cli -- telegram` |
| **WebSocket** | `npm run cli -- websocket` |
| **Cron** | `npm run cli -- cron start/stop/status` |
