#!/usr/bin/env npx tsx
import { Command } from "commander";
import { runBulbCommand, scanDevices } from "../util/tinytuya";
import { AgentLoop } from "../agent";
import { handleMessage } from '../integrations/router';
import { startTelegramBot } from '../integrations/telegram';
import { join, resolve } from 'path';
import { existsSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { spawn } from 'child_process';
import { CONFIG_DIR, PROJECT_ROOT } from '../util/paths';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local'), quiet: true });

const PID_FILE = join(CONFIG_DIR, 'cron-pid.json');

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

      const response = await handleMessage(options.message);
      console.log(`\n> Lumina: ${response}`);
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
        const response = await handleMessage(options.message);
        console.log(`\n> Lumina: ${response}`);
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
      try {
        const pidData = JSON.parse(readFileSync(PID_FILE, 'utf-8'));
        const pid = pidData.pid;
        process.kill(pid, 0); // Check if alive
        console.error(`❌ Scheduler is already running (PID: ${pid}, Started: ${pidData.startTime}).`);
        return;
      } catch {
        // Stale or invalid JSON
        unlinkSync(PID_FILE);
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
    const child = spawn('npx', ['tsx', 'src/service/runner.ts'], {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: 'ignore'
    });

    child.unref();
    if (child.pid) {
      const pidData = {
        pid: child.pid,
        startTime: new Date().toISOString()
      };
      writeFileSync(PID_FILE, JSON.stringify(pidData, null, 2));
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

    try {
      const pidData = JSON.parse(readFileSync(PID_FILE, 'utf-8'));
      const pid = pidData.pid;
      process.kill(pid, 'SIGINT');
      unlinkSync(PID_FILE);
      console.log(`✅ Scheduler (PID: ${pid}) stopped.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to stop process: ${message}`);
      // If reading JSON failed, we might want to suggest manual cleanup
      if (error instanceof SyntaxError) {
        unlinkSync(PID_FILE);
        console.log('⚠️ Removed invalid PID file.');
      }
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

    try {
      const pidData = JSON.parse(readFileSync(PID_FILE, 'utf-8'));
      const pid = pidData.pid;
      process.kill(pid, 0);
      console.log(`🟢 Scheduler is running (PID: ${pid}, Started: ${pidData.startTime}).`);
    } catch {
      console.log('🔴 Scheduler is NOT running (found stale or invalid PID file).');
    }
  });

program
  .command('telegram')
  .description('Start the Telegram bot listener')
  .action(async () => {
    try {
      await startTelegramBot();
    } catch (error: any) {
      console.error('Telegram Bot Error:', error.message || error);
      process.exit(1);
    }
  });

program.parse();
