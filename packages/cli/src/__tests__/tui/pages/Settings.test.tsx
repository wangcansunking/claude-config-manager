import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { Settings } from '../../../tui/pages/config/Settings.js';
import { initI18n } from '../../../tui/i18n.js';

vi.mock('../../../tui/util/clipboard.js', () => ({
  copyToClipboard: vi.fn().mockResolvedValue({ ok: true, via: 'pbcopy' }),
}));

beforeEach(() => {
  initI18n('en');
});

const state: any = {
  settings: { model: 'opus[1m]', env: { CLAUDE_CONFIG_LANG: 'en' }, hooks: {} },
  focused: 'main',
};

describe('<Settings/>', () => {
  it('shows current model and env keys', () => {
    const store = { getState: () => ({ setModel: vi.fn(), pushToast: vi.fn() }) };
    const { lastFrame } = render(<Settings state={state} store={store as any} />);
    expect(lastFrame()).toContain('model');
    expect(lastFrame()).toContain('opus[1m]');
    expect(lastFrame()).toContain('CLAUDE_CONFIG_LANG');
  });

  it('Enter on model row cycles model', () => {
    const setModel = vi.fn();
    const store = { getState: () => ({ setModel, pushToast: vi.fn() }) };
    const { stdin } = render(<Settings state={state} store={store as any} />);
    // cursor starts at 0 = model row
    stdin.write('\r');
    expect(setModel).toHaveBeenCalled();
    expect(typeof setModel.mock.calls[0][0]).toBe('string');
  });

  it('Enter on env row copies KEY=value to clipboard', async () => {
    const { copyToClipboard } = await import('../../../tui/util/clipboard.js');
    const pushToast = vi.fn();
    const setModel  = vi.fn();
    const store     = { getState: () => ({ pushToast, setModel }) };
    const stateWithEnv: any = {
      settings: { model: 'opus', env: { CCM_TEST: 'val123' }, hooks: {} },
      focused: 'main',
    };
    const { stdin } = render(<Settings state={stateWithEnv} store={store as any} />);
    stdin.write('j');           // move from model (idx 0) to env row (idx 1)
    stdin.write('\r');           // Enter → copy KEY=value
    await new Promise((r) => setTimeout(r, 30));
    expect(copyToClipboard).toHaveBeenCalledWith('CCM_TEST=val123');
    expect(pushToast).toHaveBeenCalled();
    expect(pushToast.mock.calls[0][0].text).toMatch(/CCM_TEST.*val123|copied/i);
  });
});
