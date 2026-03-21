/**
 * TinyTuya Execution Utility
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function runBulbCommand(command: string) {
  console.log(`Executing bulb command: ${command}`);
  try {
    const { stdout, stderr } = await execAsync(`python3 scripts/bulb_control.py ${command}`);
    if (stderr) console.error(stderr);
    return stdout;
  } catch (error) {
    console.error(`Failed to execute bulb command: ${error}`);
    throw error;
  }
}
