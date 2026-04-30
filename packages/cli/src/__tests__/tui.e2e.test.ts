import { describe, it, expect } from 'vitest';
import { spawn } from 'node-pty';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BIN = resolve(__dirname, '../../dist/index.js');

// Use the full path to the current node binary so node-pty can find it
// regardless of PATH in the test runner environment.
const NODE = process.execPath;

function launch() {
  const term = spawn(NODE, [BIN], {
    name: 'xterm-color',
    cols: 100,
    rows: 30,
    cwd: process.cwd(),
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  let output = '';
  term.onData((d) => {
    output += d;
  });

  // Set up the exit promise immediately so we don't miss the event.
  const exitPromise = new Promise<number>((resolve) => {
    term.onExit(({ exitCode }) => resolve(exitCode));
  });

  return {
    term,
    out: () => output,
    waitFor: async (pat: RegExp | string, timeout = 10000) => {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        if (typeof pat === 'string' ? output.includes(pat) : pat.test(output)) return;
        await new Promise((r) => setTimeout(r, 50));
      }
      throw new Error(`waitFor timed out: ${pat}\nOutput so far:\n${output.slice(-500)}`);
    },
    exit: () => exitPromise,
  };
}

describe('TUI E2E', () => {
  it('launches, shows Overview, navigates to Profiles, exits cleanly', async () => {
    const t = launch();
    // Wait for the TUI to render the Overview page
    await t.waitFor(/Overview/);
    // Press key '3' to navigate to Profiles (▶ marks the active page)
    t.term.write('3');
    await t.waitFor(/▶ Profiles/);
    // Press 'q' to quit
    t.term.write('q');
    const code = await t.exit();
    expect(code).toBe(0);
  });

  it('refuses to launch when stdin is not a TTY', () => {
    // Spawn directly with stdio pipes (not a pty) — stdin is not TTY.
    const result = spawnSync(NODE, [BIN], { stdio: ['pipe', 'pipe', 'pipe'] });
    expect(result.status).toBe(1);
    expect(result.stderr.toString()).toMatch(/requires a TTY/);
  });
});
