import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Commands } from '../../../tui/pages/config/Commands.js';

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
