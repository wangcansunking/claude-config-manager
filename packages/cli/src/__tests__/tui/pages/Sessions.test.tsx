import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { homedir } from 'os';
import { Sessions } from '../../../tui/pages/Sessions.js';
import { initI18n } from '../../../tui/i18n.js';

vi.mock('../../../tui/util/clipboard.js', () => ({
  copyToClipboard: vi.fn().mockResolvedValue({ ok: true, via: 'pbcopy' }),
}));

beforeEach(() => {
  initI18n('en');
});

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

  it('falls back to truncated sessionId when name is missing', () => {
    const stateWithoutName: any = {
      sessions: [
        {
          sessionId: 'abcd1234-5678-90ab',
          projectDir: '/foo',
          name: '',
          cwd: '/foo',
          startedAt: 1746000000000,
          alive: true,
          pid: 999,
          historyFile: '/home/.claude/projects/foo/abcd1234.jsonl',
        },
      ],
      focused: 'main',
      sessionHistories: new Map(),
    };
    const store = { getState: () => ({ pushToast: vi.fn(), loadSessionHistory: vi.fn() }) };
    const { lastFrame } = render(<Sessions state={stateWithoutName} store={store as any} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('abcd1234');
    expect(frame).not.toContain('untitled');
  });

  it('detail pane shows full sessionId', () => {
    const fullId = 'abcd1234-5678-90ab-cdef-ghij';
    const stateWithFullId: any = {
      sessions: [
        {
          sessionId: fullId,
          projectDir: '/foo',
          name: 'my-session',
          cwd: '/foo',
          startedAt: 1746000000000,
          alive: true,
          pid: 999,
          historyFile: '/home/.claude/projects/foo/abcd1234.jsonl',
        },
      ],
      focused: 'main',
      sessionHistories: new Map(),
    };
    const store = { getState: () => ({ pushToast: vi.fn(), loadSessionHistory: vi.fn() }) };
    const { lastFrame } = render(<Sessions state={stateWithFullId} store={store as any} />);
    const frame = lastFrame() ?? '';
    // Full session ID should appear in the detail pane
    expect(frame).toContain(fullId);
  });

  it('detail pane shows labels separated from values', () => {
    initI18n('en');
    // Construct an input path under the real home dir so tildify produces ~/...
    const home = homedir();
    const projectDir = `${home}/repos/foo`;
    const historyFile = `${home}/.claude/projects/s.jsonl`;
    const stateWithSession: any = {
      sessions: [{
        sessionId: 'a3f9c2bd-1234-5678-9abc-def012345678',
        projectDir,
        name: 'my-feature',
        alive: true,
        pid: 12345,
        historyFile,
        startedAt: Date.now(),
      }],
      sessionHistories: new Map([[historyFile, [
        { role: 'user', text: 'how do I add jwt auth', timestamp: '' },
      ]]]),
      focused: 'main',
    };
    const store = { getState: () => ({ pushToast: vi.fn(), loadSessionHistory: vi.fn() }) };
    const { lastFrame } = render(<Sessions state={stateWithSession} store={store as any} />);
    const frame = lastFrame()!;
    // Labels should appear visibly separated from values (label followed by space(s) then value)
    expect(frame).toMatch(/Project:[\s]+~\/repos\/foo/);
    expect(frame).toMatch(/Status:[\s]+(●|live|alive)/);
    // Full session ID in detail pane
    expect(frame).toContain('a3f9c2bd-1234-5678-9abc-def012345678');
    // Recent user input visible
    expect(frame).toContain('how do I add jwt auth');
    // Hint should appear exactly once
    const hintCount = (frame.match(/y:copy resume id/g) ?? []).length;
    expect(hintCount).toBe(1);
  });

  it('detail pane labels switch to zh when locale is zh', () => {
    initI18n('zh');
    const home = homedir();
    const projectDir = `${home}/repos/bar`;
    const historyFile = `${home}/.claude/projects/bar.jsonl`;
    const stateZh: any = {
      sessions: [{
        sessionId: 'b5e1f3ad-9876-5432-abcd-ef0123456789',
        projectDir,
        name: 'zh-session',
        alive: false,
        pid: 0,
        historyFile,
        startedAt: Date.now() - 3600000,
      }],
      sessionHistories: new Map([[historyFile, [
        { role: 'user', text: '有几个问题', timestamp: '' },
      ]]]),
      focused: 'main',
    };
    const store = { getState: () => ({ pushToast: vi.fn(), loadSessionHistory: vi.fn() }) };
    const { lastFrame } = render(<Sessions state={stateZh} store={store as any} />);
    const frame = lastFrame()!;
    // zh labels should be present
    expect(frame).toContain('项目:');
    expect(frame).toContain('状态:');
    // zh status value for ended session
    expect(frame).toContain('已结束');
    // List row should be 2 lines (not 3) — no orphaned time digit on a separate line
    const lines = frame.split('\n');
    const nameLineIdx = lines.findIndex((l) => l.includes('zh-session'));
    expect(nameLineIdx).toBeGreaterThan(-1);
    // The path+time line immediately follows the name line
    const pathTimeLine = lines[nameLineIdx + 1] ?? '';
    expect(pathTimeLine).toMatch(/~/); // tildified path present
    expect(pathTimeLine).toMatch(/·/); // separator present
    // No standalone time token on a third line (e.g. "1h" alone)
    const thirdLine = lines[nameLineIdx + 2] ?? '';
    expect(thirdLine).not.toMatch(/^\s+\d+[smhd]\s*$/);
  });
});
