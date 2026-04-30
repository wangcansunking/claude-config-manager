import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { Sessions } from '../../../tui/pages/Sessions.js';

vi.mock('../../../tui/util/clipboard.js', () => ({
  copyToClipboard: vi.fn().mockResolvedValue({ ok: true, via: 'pbcopy' }),
}));

const state: any = {
  sessions: [
    {
      sessionId: 's1',
      projectDir: 'foo',
      name: 'main',
      cwd: '/path/to/foo',
      startedAt: 1735689600000,
      alive: true,
      pid: 1234,
    },
    {
      sessionId: 's2',
      projectDir: 'bar',
      name: 'dev',
      cwd: '/path/to/bar',
      startedAt: 1735686000000,
      alive: false,
      pid: 0,
    },
  ],
};

describe('<Sessions/>', () => {
  it('lists projectDir and name', () => {
    const store = { getState: () => ({ pushToast: vi.fn() }) };
    const { lastFrame } = render(<Sessions state={state} store={store as any} />);
    expect(lastFrame()).toContain('foo');
    expect(lastFrame()).toContain('main');
    expect(lastFrame()).toContain('bar');
  });

  it('y triggers clipboard copy of selected sessionId', async () => {
    const pushToast = vi.fn();
    const store = { getState: () => ({ pushToast }) };
    const { stdin } = render(<Sessions state={state} store={store as any} />);
    stdin.write('y');
    await new Promise((r) => setTimeout(r, 30));
    expect(pushToast).toHaveBeenCalled();
    expect(pushToast.mock.calls[0][0].text).toMatch(/copied/i);
  });
});
