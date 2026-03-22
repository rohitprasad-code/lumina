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
  .argument('<action>', 'Action to perform (on, off, toggle, status, brightness, color)')
  .argument('[value]', 'Value for brightness (1-100) or color (hex)')
  .option('-d, --device <name>', 'Specific device ID or Name')
  .option('-j, --json', 'Output results as JSON')
  .action(async (action, value, options) => {
    try {
      const result = await runBulbCommand(action, value, options);
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(result);
      }
    } catch (error) {
      console.error('CLI Error:', error);
      process.exit(1);
    }
  });

program.parse();