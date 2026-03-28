import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { CONFIG_DIR } from './paths';

const AUTOMATIONS_PATH = join(CONFIG_DIR, 'automations.json');
const PID_FILE = join(CONFIG_DIR, 'cron-pid.json');

interface AutomationAction {
  tool: string;
  arguments: Record<string, unknown>;
}

interface Automation {
  id: string;
  name: string;
  cron: string;
  enabled: boolean;
  actions: AutomationAction[];
}

/**
 * Read all automations from config/automations.json.
 */
export function listAutomations(): Automation[] {
  if (!existsSync(AUTOMATIONS_PATH)) {
    return [];
  }
  return JSON.parse(readFileSync(AUTOMATIONS_PATH, 'utf-8')) as Automation[];
}

/**
 * Append an automation entry and persist to disk.
 */
export function addAutomation(automation: Automation): void {
  const automations = listAutomations();
  automations.push(automation);
  writeFileSync(AUTOMATIONS_PATH, JSON.stringify(automations, null, 2) + '\n');
}

/**
 * Remove an automation by ID and persist to disk.
 * Returns true if an automation was removed, false if not found.
 */
export function removeAutomation(id: string): boolean {
  const automations = listAutomations();
  const index = automations.findIndex(a => a.id === id);
  if (index === -1) return false;
  automations.splice(index, 1);
  writeFileSync(AUTOMATIONS_PATH, JSON.stringify(automations, null, 2) + '\n');
  return true;
}

/**
 * Convert a plain seconds interval to a 6-field node-cron expression.
 *
 * node-cron uses:  second minute hour dayOfMonth month dayOfWeek
 *
 * - Seconds < 60   →  *\/N * * * * *
 * - Minutes < 60   →  0 *\/N * * * *
 * - Hours          →  0 0 *\/N * * *
 */
export function secondsToCron(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `*/${totalSeconds} * * * * *`;
  }
  const minutes = Math.round(totalSeconds / 60);
  if (minutes < 60) {
    return `0 */${minutes} * * * *`;
  }
  const hours = Math.round(minutes / 60);
  return `0 0 */${hours} * * *`;
}

/**
 * Send SIGUSR1 to the running cron scheduler so it hot-reloads automations.
 * Safe to call even when no scheduler is running — it simply returns false.
 */
export function signalReload(): boolean {
  if (!existsSync(PID_FILE)) return false;

  try {
    const pidData = JSON.parse(readFileSync(PID_FILE, 'utf-8'));
    process.kill(pidData.pid, 'SIGUSR1');
    return true;
  } catch {
    return false;
  }
}
