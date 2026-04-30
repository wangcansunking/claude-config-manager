import { describe, it, expect } from 'vitest';
import { initI18n, t } from '../../tui/i18n.js';

describe('TUI i18n', () => {
  it('loads en by default and translates a known key', () => {
    initI18n('en');
    expect(t('overview.title', 'Overview')).toBe('Overview');
  });

  it('switches to zh', () => {
    initI18n('zh');
    expect(t('overview.title', 'Overview')).toMatch(/[一-鿿]/);
  });
});
