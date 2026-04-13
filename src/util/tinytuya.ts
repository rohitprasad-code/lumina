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
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string };
    if (options.json && err.stdout) {
      try {
        return JSON.parse(err.stdout);
      } catch {
        // Fallback to regular error
      }
    }

    // If the python script returned a clean error message in stdout, throw that
    if (err.stdout && err.stdout.trim().length > 0) {
      throw new Error(err.stdout.trim());
    } else if (err.stderr && err.stderr.trim().length > 0) {
      throw new Error(err.stderr.trim());
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error scanning devices:", message);
    process.exit(1);
  }
}

export async function executeCommandOnMultiple(
  devices: any[],
  command: string,
  value?: string,
  options: { json?: boolean } = {}
) {
  const promises = devices.map(device => {
    return runBulbCommand(command, value, { ...options, device: device.id })
      .then(result => ({ device, success: true, result }))
      .catch(error => ({ device, success: false, error }));
  });

  return Promise.all(promises);
}
