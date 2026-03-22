#!/usr/bin/env npx tsx
import { Command } from 'commander';
import { runBulbCommand } from '../util/tinytuya';

const program = new Command();

program
  .name('lumina-cli')
  .description('CLI to control smart bulbs and other devices')
  .version('0.1.0');

program
  .command('bulb')
  .description('Control smart bulbs')
  .argument('<action>', 'Action to perform (e.g., on, off)')
  .action(async (action) => {
    try {
      const result = await runBulbCommand(action);
      console.log('Result:', result);
    } catch (error) {
      console.error('CLI Error:', error);
      process.exit(1);
    }
  });

program.parse();