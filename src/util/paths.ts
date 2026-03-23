import { join } from 'path';
import { existsSync } from 'fs';

// Safely get project root regardless of where CLI is invoked
export const PROJECT_ROOT = join(__dirname, '..', '..');

// Common directories
export const CONFIG_DIR = join(PROJECT_ROOT, 'config');
export const SCRIPTS_DIR = join(PROJECT_ROOT, 'scripts');

// Python environment
const venvPath = join(PROJECT_ROOT, '.venv', 'bin', 'python');
export const PYTHON_CMD = existsSync(venvPath) ? venvPath : 'python3';
