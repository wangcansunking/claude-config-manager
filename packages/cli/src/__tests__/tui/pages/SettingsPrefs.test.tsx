import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { SettingsPrefs } from '../../../tui/pages/SettingsPrefs.js';
import { initI18n } from '../../../tui/i18n.js';

beforeEach(() => {
  initI18n('en');
});

const state: any = {
  settings: { env: { CLAUDE_CONFIG_LANG: 'en' } },
  focused: 'main',
};

describe('<SettingsPrefs/>', () => {
  it('renders language and theme rows', () => {
    const store = { getState: () => ({ setLanguage: vi.fn(), pushToast: vi.fn() }) };
    const { lastFrame } = render(<SettingsPrefs state={state} store={store as any} />);
    expect(lastFrame()).toContain('language');
    expect(lastFrame()).toContain('en');
    expect(lastFrame()).toContain('theme');
  });

  it('Enter on language row toggles en ↔ zh', () => {
    const setLanguage = vi.fn();
    const store = { getState: () => ({ setLanguage, pushToast: vi.fn() }) };
    const { stdin } = render(<SettingsPrefs state={state} store={store as any} />);
    stdin.write('\r');
    expect(setLanguage).toHaveBeenCalledWith('zh');
  });
});
