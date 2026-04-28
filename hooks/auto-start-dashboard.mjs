#!/usr/bin/env node
// Hook script: auto-start dashboard on Claude Code session start
// Only starts if no instance is already running (single-instance via PID lock)

import { join } from 'path';
import { readFile, writeFile, unlink } from 'fs/promises';
import { spawn } from 'child_process';
import { homedir } from 'os';

const LOCK_FILE = join(homedir(), '.claude', 'ccm-dashboard.pid');
const PORT = 3399;

async function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  // Check existing lock
  try {
    const content = await readFile(LOCK_FILE, 'utf-8');
    const data = JSON.parse(content);
    if (data.pid && await isProcessRunning(data.pid)) {
      // Already running, nothing to do
      process.exit(0);
    }
    // Stale lock, clean up
    await unlink(LOCK_FILE).catch(() => {});
  } catch {
    // No lock file — proceed to start
  }

  // Find dashboard directory relative to this hook script
  const dashboardDir = join(new URL('.', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1'), '..', 'packages', 'dashboard');
  const serverEntry = join(dashboardDir, 'dist', 'server.mjs');

  // Start the pre-built Vite + Express server in detached mode
  const child = spawn(process.execPath, [serverEntry], {
    cwd: dashboardDir,
    stdio: 'ignore',
    detached: true,
    env: { ...process.env, PORT: String(PORT) },
  });

  child.unref();

  if (child.pid) {
    await writeFile(LOCK_FILE, JSON.stringify({ pid: child.pid, port: PORT, startedAt: Date.now() }));
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
