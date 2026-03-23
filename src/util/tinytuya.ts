/**
 * TinyTuya Execution Utility
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export async function runBulbCommand(command: string, value?: string, options: { json?: boolean, device?: string } = {}) {
  const jsonFlag = options.json ? ' --json' : '';
  const deviceFlag = options.device ? ` --device "${options.device}"` : '';
  const valueArg = value ? ` ${value}` : '';
  
  const fullCommand = `${command}${valueArg}${deviceFlag}${jsonFlag}`;
  console.log(`Executing bulb command: ${fullCommand}`);
  
  // Detect virtual environment
  const venvPath = join(process.cwd(), '.venv', 'bin', 'python');
  const pythonCmd = existsSync(venvPath) ? venvPath : 'python3';

  try {
    const { stdout, stderr } = await execAsync(`${pythonCmd} scripts/bulb_control.py ${fullCommand}`);

    if (stderr) console.error(stderr);
    return options.json ? JSON.parse(stdout) : stdout;
  } catch (error: any) {
    if (options.json && error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch {
        // Fallback to regular error
      }
    }
    
    // If the python script returned a clean error message in stdout, throw that
    if (error.stdout && error.stdout.trim().length > 0) {
      throw new Error(error.stdout.trim());
    } else if (error.stderr && error.stderr.trim().length > 0) {
      throw new Error(error.stderr.trim());
    }
    
    throw error;
  }
}
