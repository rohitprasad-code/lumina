#!/usr/bin/env npx tsx
import { Command } from "commander";
import { runBulbCommand, scanDevices } from "../util/tinytuya";
import { AgentLoop } from "../agent";
import { join } from 'path';
import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { spawn } from 'child_process';
import { CONFIG_DIR, PROJECT_ROOT } from '../util/paths';

const PID_FILE = join(CONFIG_DIR, 'lumina-cron.pid');

const program = new Command();

program
  .name("lumina-cli")
  .description("CLI to control smart bulbs and other devices")
  .option(
    "-m, --message <text>",
    "natural language message to control the device",
  )
  .option("-d, --device <name>", "specific device ID or name")
  .option("-s, --scan", "scan for devices")
  .version("0.1.0")
  .action(async (options) => {
    if (options.scan) {
      await scanDevices();
      return;
    }

    if (options.message) {
      const target = options.device ? ` for device: ${options.device}` : "";
      console.log(`> Processing message: "${options.message}"${target}\n`);

      const loop = new AgentLoop();
      await loop.processUserInput(options.message);
    } else {
      program.help();
    }
  });

program
  .command("bulb")
  .description("Control smart bulbs")
  .argument(
    "[action]",
    "Action to perform (on, off, toggle, status, brightness, color)",
  )
  .argument("[value]", "Value for brightness (1-100) or color (hex)")
  .option("-d, --device <name>", "Specific device ID or Name")
  .option("-j, --json", "Output results as JSON")
  .option(
    "-m, --message <text>",
    "Natural language message to control the bulb",
  )
  .action(async (action, value, options) => {
    try {
      if (options.message) {
        console.log(`Processing message: "${options.message}"\n`);
        const loop = new AgentLoop();
        await loop.processUserInput(options.message);
        return;
      }

      if (!action) {
        console.error("error: missing required argument 'action'");
        process.exit(1);
      }

      const result = await runBulbCommand(action, value, options);
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(result);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(message);
      process.exit(1);
    }
  });

const cron = program.command("cron").description("Manage scheduled automations");

cron
  .command("start")
  .description("Start the automation scheduler in the background")
  .option("-f, --foreground", "Run in the foreground (standard output)")
  .action(async (options) => {
    if (existsSync(PID_FILE)) {
      const pid = parseInt(readFileSync(PID_FILE, 'utf-8'));
      try {
        process.kill(pid, 0); // Check if alive
        console.error(`❌ Scheduler is already running (PID: ${pid}).`);
        return;
      } catch {
        unlinkSync(PID_FILE); // Stale PID
      }
    }

    if (options.foreground) {
      const { CronManager } = await import('../service/cron');
      console.log('🚀 Starting Lumina Cron Service (Foreground)...');
      const manager = new CronManager();
      await manager.init();
      return;
    }

    // Detached background process
    const child = spawn('npx', ['tsx', 'src/test-cron.ts'], {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: 'ignore'
    });

    child.unref();
    if (child.pid) {
      writeFileSync(PID_FILE, child.pid.toString());
      console.log(`🚀 Scheduler started in background (PID: ${child.pid}).`);
    } else {
      console.error('❌ Failed to start background process.');
    }
  });

cron
  .command("stop")
  .description("Stop the background scheduler")
  .action(() => {
    if (!existsSync(PID_FILE)) {
      console.error('❌ No scheduler is currently running.');
      return;
    }

    const pid = parseInt(readFileSync(PID_FILE, 'utf-8'));
    try {
      process.kill(pid, 'SIGINT');
      unlinkSync(PID_FILE);
      console.log(`✅ Scheduler (PID: ${pid}) stopped.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to stop process ${pid}: ${message}`);
    }
  });

cron
  .command("status")
  .description("Check scheduler status")
  .action(() => {
    if (!existsSync(PID_FILE)) {
      console.log('⚪ Scheduler is NOT running.');
      return;
    }

    const pid = parseInt(readFileSync(PID_FILE, 'utf-8'));
    try {
      process.kill(pid, 0);
      console.log(`🟢 Scheduler is running (PID: ${pid}).`);
    } catch {
      console.log('🔴 Scheduler is NOT running (found stale PID file).');
    }
  });

program.parse();
