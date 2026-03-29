#!/usr/bin/env npx tsx
import { Command } from 'commander';
import { runBulbCommand, scanDevices } from '../util/tinytuya';
import { handleMessage } from '../integrations/router';
import { startTelegramBot } from '../integrations/telegram';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local'), quiet: true });

const program = new Command();

program
  .name('lumina-cli')
  .description('CLI to control smart bulbs and other devices')
  .option('-m, --message <text>', 'natural language message to control the device')
  .option('-d, --device <name>', 'specific device ID or name')
  .option('-s, --scan', 'scan for devices')
  .version('0.1.0')
  .action(async (options) => {
    if (options.scan) {
      await scanDevices();
      return;
    }

    if (options.message) {
      const target = options.device ? ` for device: ${options.device}` : '';
      console.log(`> Processing message: "${options.message}"${target}\n`);

      const response = await handleMessage(options.message);
      console.log(`\n> Lumina: ${response}`);
    } else {
      program.help();
    }
  });

program
  .command('bulb')
  .description('Control smart bulbs')
  .argument('[action]', 'Action to perform (on, off, toggle, status, brightness, color)')
  .argument('[value]', 'Value for brightness (1-100) or color (hex)')
  .option('-d, --device <name>', 'Specific device ID or Name')
  .option('-j, --json', 'Output results as JSON')
  .option('-m, --message <text>', 'Natural language message to control the bulb')
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
    } catch (error: any) {
      console.error(error.message || error);
      process.exit(1);
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