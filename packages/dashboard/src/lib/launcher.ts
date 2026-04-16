// Dashboard launcher with single-instance lock
// Used by the plugin hook to auto-start dashboard on Claude Code session start

import { join } from 'path';
import { readFile, writeFile, unlink } from 'fs/promises';
import { spawn } from 'child_process';
import { homedir } from 'os';

const LOCK_FILE = join(homedir(), '.claude', 'ccm-dashboard.pid');
const DEFAULT_PORT = 3399;

async function isProcessRunning(pid: number): Promise<boolean> {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function readLock(): Promise<{ pid: number; port: number } | null> {
  try {
    const content = await readFile(LOCK_FILE, 'utf-8');
    const data = JSON.parse(content);
    if (data.pid && await isProcessRunning(data.pid)) {
      return data;
    }
    // Stale lock — process is dead
    await unlink(LOCK_FILE).catch(() => {});
    return null;
  } catch {
    return null;
  }
}

async function writeLock(pid: number, port: number): Promise<void> {
  await writeFile(LOCK_FILE, JSON.stringify({ pid, port, startedAt: Date.now() }));
}

export async function ensureDashboardRunning(port: number = DEFAULT_PORT): Promise<{ pid: number; port: number; alreadyRunning: boolean }> {
  // Check if already running
  const existing = await readLock();
  if (existing) {
    return { ...existing, alreadyRunning: true };
  }

  // Start new instance
  const dashboardDir = join(__dirname, '..');
  const child = spawn('npx', ['next', 'start', '-p', String(port)], {
    cwd: dashboardDir,
    stdio: 'ignore',
    detached: true,
    shell: true,
  });

  child.unref();

  if (child.pid) {
    await writeLock(child.pid, port);
  }

  return { pid: child.pid ?? 0, port, alreadyRunning: false };
}

export async function stopDashboard(): Promise<boolean> {
  const lock = await readLock();
  if (!lock) return false;

  try {
    process.kill(lock.pid, 'SIGTERM');
    await unlink(LOCK_FILE).catch(() => {});
    return true;
  } catch {
    await unlink(LOCK_FILE).catch(() => {});
    return false;
  }
}

export async function getDashboardStatus(): Promise<{ running: boolean; pid?: number; port?: number }> {
  const lock = await readLock();
  if (lock) {
    return { running: true, pid: lock.pid, port: lock.port };
  }
  return { running: false };
}
