# Cron Scheduler Setup Guide

The Lumina Cron Scheduler allows you to automate tasks and run them in the background.

---

## 1. Concepts
Lumina uses a background process to manage scheduled tasks. This is useful for:
- Periodic device health checks.
- Time-based lighting changes (e.g., dimming at night).
- Smart home scenes synchronized with external events.

## 2. Managing the Scheduler
The scheduler is managed via simple CLI commands.

### Start the Scheduler
You can start the scheduler in the background (detached process) or foreground:
```bash
# Start in the background (recommended)
npm run cli -- cron start

# Start in the foreground (useful for debugging)
npm run cli -- cron start --foreground
```

### Stop the Scheduler
To stop a background scheduler:
```bash
npm run cli -- cron stop
```

### Check Status
Verify if the scheduler is running and see its PID:
```bash
npm run cli -- cron status
```

## 3. Configuration
The scheduler configuration is stored in the `src/service/cron.ts` file or via future JSON configuration updates. Ensure the `config/` directory exists for PID management.
