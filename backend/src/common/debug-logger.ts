/**
 * Debug instrumentation logger – appends NDJSON to .cursor/debug.log.
 * Used during debug sessions for runtime evidence.
 */
import * as fs from 'fs';
import * as path from 'path';

// Resolve project root: backend/ or mobile/ → parent
const root = process.cwd().replace(/(\/backend|\/mobile)$/, '') || process.cwd();
const LOG_PATH = path.join(root, '.cursor', 'debug.log');

export function debugLog(payload: {
  location?: string;
  message?: string;
  data?: Record<string, unknown>;
  hypothesisId?: string;
}) {
  try {
    const dir = path.dirname(LOG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const line = JSON.stringify({ ...payload, timestamp: Date.now() }) + '\n';
    fs.appendFileSync(LOG_PATH, line);
  } catch {
    // Silently ignore write errors
  }
}
