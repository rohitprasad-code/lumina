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
import { startWebSocketServer } from '../integrations/websocket';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local'), quiet: true });

const PID_FILE = join(CONFIG_DIR, 'cron-pid.json');

const program = new Command();

program
  .name("lumina-cli")
  .description("CLI to control smart bulbs and other devices")
  .argument('[arg1]', 'Primary command (action or type)')
  .argument('[arg2]', 'Target name or action')
  .argument('[arg3]', 'Target action if resolving by specific name')
  .argument('[arg4]', 'Optional value for action')
  .option("-m, --message <text>", "natural language message to control the device")
  .option("-d, --device <name>", "specific device ID or name")
  .option("-s, --scan", "scan for devices")
  .option("-a, --all", "apply to all devices bypass prompt")
  .option("-j, --json", "Output results as JSON")
  .version("0.1.0")
  .action(async (arg1, arg2, arg3, arg4, options) => {
    if (options.scan) {
      await scanDevices();
      return;
    }

    if (options.message) {
      const target = options.device ? ` for device: ${options.device}` : "";
      console.log(`> Processing message: "${options.message}"${target}\n`);
      const response = await handleMessage(options.message);
      console.log(`\n> Lumina: ${response}`);
      return;
    }

    if (!arg1) {
      program.help();
      return;
    }

    const { resolveGlobalConflict } = await import('./prompt');
    const { registry } = await import('../service/registry');

    const validActions = ['on', 'off', 'toggle', 'status', 'brightness', 'color'];
    let targetDevices: any[] = [];
    let actionToRun = '';
    let actionValue = '';

    try {
      if (validActions.includes(arg1)) {
        actionToRun = arg1;
        actionValue = arg2 || '';
        
        if (options.all) {
          targetDevices = registry.getAllDevices();
        } else {
          const resolution = await resolveGlobalConflict(arg1);
          if (!resolution) process.exit(0);

          if (resolution.type === 'all') {
            targetDevices = registry.getAllDevices();
          } else if (resolution.type === 'category') {
            targetDevices = registry.getDevicesByType(resolution.category);
          } else if (resolution.type === 'device') {
            const dev = registry.getDeviceByIdOrName(resolution.deviceId);
            if (dev) targetDevices = [dev];
          }
        }
      } else {
        if (arg2 && validActions.includes(arg2)) {
          // lumina bulb off
          actionToRun = arg2;
          actionValue = arg3 || '';
          targetDevices = registry.getDevicesByType(arg1);
        } else if (arg2 && arg3 && validActions.includes(arg3)) {
          // lumina bulb "Living Room" off
          actionToRun = arg3;
          actionValue = arg4 || '';
          const dev = registry.getDeviceByIdOrName(arg2);
          if (dev) targetDevices = [dev];
        } else {
          console.error(`Invalid command format. Action must be one of: ${validActions.join(', ')}`);
          process.exit(1);
        }
      }

      if (targetDevices.length === 0) {
        console.error('No matching devices found to apply the command.');
        process.exit(1);
      }

      // Execute requested actions in parallel
      console.log(`Sending '${actionToRun}' to ${targetDevices.length} device(s) concurrently...`);
      const { executeCommandOnMultiple } = await import('../util/tinytuya');
      const results = await executeCommandOnMultiple(targetDevices, actionToRun, actionValue, options);
      
      results.forEach((res) => {
        if (res.success) {
          const { device, result } = res as { device: any, result: any, success: true };
          if (options.json) {
            console.log(JSON.stringify({ device: device.name, result }, null, 2));
          } else {
            console.log(`✅ [${device.name}]: Actions pushed successfully.`);
          }
        } else {
          const { device, error } = res as { device: any, error: any, success: false };
          console.error(`❌ [${device.name}] Error:`, error?.message || String(error));
        }
      });

    } catch (error: any) {
      console.error(error.message || String(error));
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

program
  .command('websocket')
  .description('Start the WebSocket server listener')
  .action(async () => {
    try {
      await startWebSocketServer();
    } catch (error: any) {
      console.error('WebSocket Server Error:', error.message || error);
      process.exit(1);
    }
  });

program.parse();
