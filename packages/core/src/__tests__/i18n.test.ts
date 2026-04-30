import { describe, it, expect } from 'vitest';
import { locales, supportedLanguages, getResource } from '../i18n/index.js';

describe('@ccm/core i18n', () => {
  it('exposes en and zh locales', () => {
    expect(supportedLanguages).toEqual(['en', 'zh']);
    expect(locales.en).toBeDefined();
    expect(locales.zh).toBeDefined();
  });

  it('en and zh have the same top-level keys', () => {
    expect(Object.keys(locales.en).sort()).toEqual(Object.keys(locales.zh).sort());
  });

  it('getResource returns en bundle for unknown language', () => {
    expect(getResource('xx' as 'en')).toBe(locales.en);
  });
});
