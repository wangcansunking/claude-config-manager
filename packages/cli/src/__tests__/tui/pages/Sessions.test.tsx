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
      historyFile: '/home/.claude/projects/foo/s1.jsonl',
    },
    {
      sessionId: 's2',
      projectDir: 'bar',
      name: 'dev',
      cwd: '/path/to/bar',
      startedAt: 1735686000000,
      alive: false,
      pid: 0,
      historyFile: '/home/.claude/projects/bar/s2.jsonl',
    },
  ],
  focused: 'main',
  sessionHistories: new Map(),
};

describe('<Sessions/>', () => {
  it('lists projectDir and name', () => {
    const store = { getState: () => ({ pushToast: vi.fn(), loadSessionHistory: vi.fn() }) };
    const { lastFrame } = render(<Sessions state={state} store={store as any} />);
    expect(lastFrame()).toContain('foo');
    expect(lastFrame()).toContain('main');
    expect(lastFrame()).toContain('bar');
  });

  it('y triggers clipboard copy of selected sessionId', async () => {
    const pushToast = vi.fn();
    const store = { getState: () => ({ pushToast, loadSessionHistory: vi.fn() }) };
    const { stdin } = render(<Sessions state={state} store={store as any} />);
    stdin.write('y');
    await new Promise((r) => setTimeout(r, 30));
    expect(pushToast).toHaveBeenCalled();
    expect(pushToast.mock.calls[0][0].text).toMatch(/copied/i);
  });

  it('renders session name prominently when present', () => {
    const stateWithNamed: any = {
      sessions: [
        {
          sessionId: 's1',
          projectDir: '/foo',
          name: 'my-feature-work',
          cwd: '/foo',
          startedAt: 1746000000000,
          alive: true,
          pid: 999,
          historyFile: '/home/.claude/projects/foo/s1.jsonl',
        },
      ],
      focused: 'main',
      sessionHistories: new Map([
        [
          '/home/.claude/projects/foo/s1.jsonl',
          [{ role: 'user', text: 'how do I refactor this?', timestamp: '' }],
        ],
      ]),
    };
    const store = { getState: () => ({ pushToast: vi.fn(), loadSessionHistory: vi.fn() }) };
    const { lastFrame } = render(<Sessions state={stateWithNamed} store={store as any} />);
    expect(lastFrame()).toContain('my-feature-work');
  });

  it('renders recent user inputs from history in detail pane', () => {
    const historyFile = '/home/.claude/projects/foo/s1.jsonl';
    const stateWithHistory: any = {
      sessions: [
        {
          sessionId: 's1',
          projectDir: '/foo',
          name: 'feature-x',
          cwd: '/foo',
          startedAt: 1746000000000,
          alive: true,
          pid: 999,
          historyFile,
        },
      ],
      focused: 'main',
      sessionHistories: new Map([
        [
          historyFile,
          [
            { role: 'user', text: 'how do I refactor this?', timestamp: '' },
            { role: 'user', text: 'what about the tests?', timestamp: '' },
          ],
        ],
      ]),
    };
    const store = { getState: () => ({ pushToast: vi.fn(), loadSessionHistory: vi.fn() }) };
    const { lastFrame } = render(<Sessions state={stateWithHistory} store={store as any} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('how do I refactor this?');
    expect(frame).toContain('what about the tests?');
  });
});
