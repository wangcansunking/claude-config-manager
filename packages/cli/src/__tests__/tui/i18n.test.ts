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

  it('switches sidebar labels to Chinese after changeLanguage', () => {
    initI18n('zh');
    expect(t('nav.overview')).toMatch(/[一-龥]/);
    expect(t('nav.config')).toMatch(/[一-龥]/);
    expect(t('nav.sessions')).toMatch(/[一-龥]/);
  });

  it('returns English sidebar labels in en mode', () => {
    initI18n('en');
    expect(t('nav.overview')).toBe('Overview');
    expect(t('nav.config')).toBe('Config');
    expect(t('nav.sessions')).toBe('Sessions');
    expect(t('nav.recommend')).toBe('Recommend');
    expect(t('nav.settings')).toBe('Settings');
  });

  it('supports interpolation vars', () => {
    initI18n('en');
    expect(t('sessions.title', { n: 5 })).toBe('Sessions (5)');
    expect(t('config.plugins.title', { n: 3 })).toBe('Plugins (3 installed)');
    expect(t('toasts.enabled', { name: 'vercel' })).toBe('Enabled vercel');
    expect(t('modals.switch_profile_title', { name: 'work' })).toBe('Switch to work?');
  });

  it('supports zh interpolation', () => {
    initI18n('zh');
    expect(t('sessions.title', { n: 5 })).toBe('会话 (5)');
    expect(t('toasts.enabled', { name: 'vercel' })).toBe('已启用 vercel');
    expect(t('modals.switch_profile_title', { name: 'work' })).toBe('切换到 work？');
  });

  it('footer labels are translated in zh', () => {
    initI18n('zh');
    expect(t('footer.nav')).toMatch(/[一-龥]/);
    expect(t('footer.quit')).toMatch(/[一-龥]/);
  });

  it('footer labels are English in en', () => {
    initI18n('en');
    expect(t('footer.nav')).toBe('nav');
    expect(t('footer.quit')).toBe('quit');
  });
});
