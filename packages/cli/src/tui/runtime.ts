import React from 'react';
import { render } from 'ink';
import { App } from './App.js';

export interface TerminalCapabilities {
  isTTY: boolean;
  columns: number;
  rows: number;
}

export type LaunchVerdict = { ok: true } | { ok: false; reason: 'non-tty' | 'too-small' };

const MIN_COLS = 60;
const MIN_ROWS = 15;

export function canLaunchTui(caps: TerminalCapabilities): LaunchVerdict {
  if (!caps.isTTY) return { ok: false, reason: 'non-tty' };
  if (caps.columns < MIN_COLS || caps.rows < MIN_ROWS) {
    return { ok: false, reason: 'too-small' };
  }
  return { ok: true };
}

export async function runTui(): Promise<number> {
  const verdict = canLaunchTui({
    isTTY: process.stdin.isTTY === true,
    columns: process.stdout.columns ?? 0,
    rows: process.stdout.rows ?? 0,
  });

  if (!verdict.ok) {
    if (verdict.reason === 'non-tty') {
      console.error(
        'claude-config requires a TTY. Use subcommands for scripted workflows: claude-config --help',
      );
    } else {
      console.error(
        `claude-config TUI requires terminal ≥ ${MIN_COLS}×${MIN_ROWS}. Resize and retry.`,
      );
    }
    return 1;
  }

  const ink = render(React.createElement(App));

  const cleanup = async (code: number) => {
    ink.unmount();
    process.exit(code);
  };
  process.on('SIGINT', () => void cleanup(0));
  process.on('SIGTERM', () => void cleanup(0));
  process.on('uncaughtException', (e) => {
    ink.unmount();
    console.error('\nccm tui crashed:', e);
    console.error(
      '\nReport at https://github.com/wangcansunking/claude-config-manager/issues',
    );
    process.exit(1);
  });

  await ink.waitUntilExit();
  return 0;
}
