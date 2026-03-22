/**
 * TinyTuya Execution Utility
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export async function runBulbCommand(command: string) {
  console.log(`Executing bulb command: ${command}`);
  
  // Detect virtual environment
  const venvPath = join(process.cwd(), '.venv', 'bin', 'python');
  const pythonCmd = existsSync(venvPath) ? venvPath : 'python3';

  try {
    const { stdout, stderr } = await execAsync(`${pythonCmd} scripts/bulb_control.py ${command}`);

    if (stderr) console.error(stderr);
    return stdout;
  } catch (error) {
    console.error(`Failed to execute bulb command: ${error}`);
    throw error;
  }
}
