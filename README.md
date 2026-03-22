# Lumina — AI Agent

> Control your smart devices via direct CLI commands or natural language.
> Two lanes, one entry point. Runs fully local via Ollama. Extensible to Telegram & WhatsApp.

---

## Architecture Overview

```
     ┌─────────────────────────────┐            ┌─────────────────────┐
     │             CLI             │            │      Telegram       │
     │   parse args → detect mode  │            │      WhatsApp       │
     └────────┬─────────────────┬──┘            └──────────┬──────────┘
              │                 |                          │
              │  bulb on        │ bulb -m "light on karna" │
              │                 │                          │
              │                 └────────────────┐         │
        DIRECT LANE                              │         │
              │                                  │         │
              ▼                                  │         │
  ┌───────────────────────┐                      ▼         ▼
  │    Command parser     │              ┌───────────────────────────┐
  │  on/off/bright/color  │◄─────────────┤      Message router       │
  └───────────┬───────────┘  response    │ {text, userId, src, reply}│
              │                          └────────────┬──────────────┘
              │                                       │ text
              │                          ┌────────────▼──────────────┐
              │                          │    Ollama  (llama3.1)     │
              │                          │  ollama.chat() + tools    │
              │                          └────────────┬──────────────┘
              │                    result ◄──── loop  │ tool_calls[]
              │                          ┌────────────▼──────────────┐
              │                          │         Agent loop        │
              │                          │   parse + dispatch tools  │
              │                          └────────────┬──────────────┘
              │                                       │
              │     ┌───────────────────────┐         │
              └────►│    executeTool()      │◄────────┘
                    └───────────┬───────────┘
                                │
                                │
                                ▼
                    ┌────────────────────────┐
                    │      Wipro Bulb        │
                    │    TinyTuya — LAN      │
                    └────────────────────────┘
```

### Two lanes, one bulb

|              | Direct lane          | AI (message) lane               |
| ------------ | -------------------- | ------------------------------- |
| Entry        | `bulb on`            | `bulb -m "dim the lights"`      |
| Parsed by    | Command parser       | Message router → Ollama         |
| Intelligence | None — exact command | LLM decides which tools to call |
| Latency      | ~100ms               | ~1–3s (LLM round-trip)          |
| Multi-step   | No                   | Yes — chains multiple tools     |
| Sources      | CLI only             | CLI `-m`, Telegram, WhatsApp    |

---

## Usage

```bash
# Direct lane — fast, exact
bulb on | off | brightness 70 | scene movie | status

# AI lane — natural language
bulb -m "dim to 30 percent and make it warm"
```

---

## Folder Structure

```
src/
  index.ts          # CLI entry — mode detection
  agent.ts          # Ollama chat loop + tool dispatch
  types.ts          # Shared interfaces
  tools/            # Tool schemas (definitions.ts) + dispatcher (executor.ts)
  integrations/     # Message router, Telegram & WhatsApp (planned)
scripts/
  bulb_control.py   # TinyTuya LAN controller
config/
  scenes.json       # Scene presets
```

---

## Roadmap

- **Phase 1 — IoT control** ✅ Bulb paired, TinyTuya verified
- **Phase 2 — CLI direct lane** ✅ Arg parsing, command execution
- **Phase 3 — AI message lane** ✅ Ollama loop, multi-tool chaining, `-m` flag
- **Phase 4 — Telegram & WhatsApp** 🔜 Bot listeners, message routing, per-user history
- **Phase 5 — Automation** 🔜 Cron scenes, sunset-aware, CI/CD indicator, voice input

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Connection refused | Use LAN IP — run `tinytuya scan` |
| Invalid key | Re-run `tinytuya wizard` |
| Ollama not reachable | Run `ollama serve` |
| Plain text instead of tool calls | Use `llama3.1` or `mistral` |
| `set_color` fails | Wipro 12W may not support RGB |
