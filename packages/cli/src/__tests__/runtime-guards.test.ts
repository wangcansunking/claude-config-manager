import { describe, it, expect, vi } from 'vitest';
import { canLaunchTui } from '../tui/runtime.js';

describe('canLaunchTui', () => {
  it('refuses when stdin is not TTY', () => {
    expect(canLaunchTui({ isTTY: false, columns: 100, rows: 30 })).toEqual({
      ok: false,
      reason: 'non-tty',
    });
  });

  it('refuses when terminal is too small', () => {
    expect(canLaunchTui({ isTTY: true, columns: 50, rows: 30 })).toEqual({
      ok: false,
      reason: 'too-small',
    });
    expect(canLaunchTui({ isTTY: true, columns: 100, rows: 10 })).toEqual({
      ok: false,
      reason: 'too-small',
    });
  });

  it('allows when TTY and at least 60×15', () => {
    expect(canLaunchTui({ isTTY: true, columns: 60, rows: 15 })).toEqual({ ok: true });
    expect(canLaunchTui({ isTTY: true, columns: 200, rows: 50 })).toEqual({ ok: true });
  });
});
