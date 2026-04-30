import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { Settings } from '../../../tui/pages/config/Settings.js';

const state: any = {
  settings: { model: 'opus[1m]', env: { CLAUDE_CONFIG_LANG: 'en' }, hooks: {} },
};

describe('<Settings/>', () => {
  it('shows current model and env keys', () => {
    const store = { getState: () => ({ setModel: vi.fn() }) };
    const { lastFrame } = render(<Settings state={state} store={store as any} />);
    expect(lastFrame()).toContain('model');
    expect(lastFrame()).toContain('opus[1m]');
    expect(lastFrame()).toContain('CLAUDE_CONFIG_LANG');
  });

  it('Enter on model row cycles model', () => {
    const setModel = vi.fn();
    const store = { getState: () => ({ setModel }) };
    const { stdin } = render(<Settings state={state} store={store as any} />);
    stdin.write('\r');
    expect(setModel).toHaveBeenCalled();
    expect(typeof setModel.mock.calls[0][0]).toBe('string');
  });
});
