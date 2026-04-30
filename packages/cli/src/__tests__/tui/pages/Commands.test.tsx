import { describe, it, expect, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { Commands } from '../../../tui/pages/config/Commands.js';
import { initI18n } from '../../../tui/i18n.js';

beforeEach(() => { initI18n('en'); });

const state: any = {
  commands: [
    { name: 'ccm-dashboard', source: 'plugin' },
    { name: 'init',          source: 'user'   },
  ],
};

describe('<Commands/>', () => {
  it('lists slash commands', () => {
    const store = { getState: () => ({}) } as any;
    const { lastFrame } = render(<Commands state={state} store={store} />);
    expect(lastFrame()).toContain('/ccm-dashboard');
    expect(lastFrame()).toContain('/init');
  });
});
