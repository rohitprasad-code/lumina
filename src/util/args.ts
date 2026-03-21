/**
 * CLI Argument Parser Utility
 */

import { parseArgs } from 'util';

export function getArgs() {
  return parseArgs({
    args: process.argv.slice(2),
    options: {
      message: { type: 'string', short: 'm' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: false,
  });
}
