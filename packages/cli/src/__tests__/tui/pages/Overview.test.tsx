import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { Overview } from '../../../tui/pages/Overview.js';
import { initI18n } from '../../../tui/i18n.js';

beforeEach(() => {
  initI18n('en');
});

const baseState: any = {
  activeProfile: 'work',
  plugins: [{ name: 'a' }, { name: 'b' }],
  mcpServers: [{ name: 'm' }],
  skills: [],
  commands: [],
  sessions: [
    { projectDir: 'foo', sessionId: 's1', pid: 1234, cwd: '/tmp', startedAt: 1000, alive: true },
  ],
  dashboardStatus: { running: true, port: 3399 },
  loading: {},
};

describe('<Overview/>', () => {
  it('shows counts and active profile', () => {
    const { lastFrame } = render(<Overview state={baseState} />);
    expect(lastFrame()).toContain('work');
    expect(lastFrame()).toContain('Plugins: 2');
    expect(lastFrame()).toContain('MCPs: 1');
    expect(lastFrame()).toContain('Skills: 0');
  });
});
