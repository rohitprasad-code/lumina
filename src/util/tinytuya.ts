import { exec } from "child_process";
import { promisify } from "util";
import { join } from "path";
import { PROJECT_ROOT, CONFIG_DIR, PYTHON_CMD } from "./paths";

const execAsync = promisify(exec);

export async function runBulbCommand(command: string, value?: string, options: { json?: boolean; device?: string } = {}) {
  const jsonFlag = options.json ? " --json" : "";
  const deviceFlag = options.device ? ` --device "${options.device}"` : "";
  const valueArg = value ? ` ${value}` : "";

  const fullCommand = `${command}${valueArg}${deviceFlag}${jsonFlag}`;
  console.log(`Executing bulb command: ${fullCommand}`);

  try {
    const scriptPath = join(PROJECT_ROOT, "scripts", "bulb_control.py");
    const { stdout, stderr } = await execAsync(
      `${PYTHON_CMD} ${scriptPath} ${fullCommand}`,
      { cwd: PROJECT_ROOT },
    );

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
export async function scanDevices() {
  console.log(
    "Scanning for Tuya devices on the local network... (this may take a moment)",
  );

  try {
    // Run the scan from inside the config directory so any generated files stay there
    const { stdout, stderr } = await execAsync(
      `${PYTHON_CMD} -m tinytuya scan`,
      { cwd: CONFIG_DIR },
    );
    if (stderr && !stderr.includes("Scanning")) console.error(stderr);
    console.log(stdout);
  } catch (error: any) {
    console.error("Error scanning devices:", error.message || error);
    process.exit(1);
  }
}
