import i18next from 'i18next';
import { locales } from '@ccm/core/i18n';

let initialized = false;
let currentLang: 'en' | 'zh' = 'en';

export function initI18n(lang: 'en' | 'zh'): void {
  if (initialized && lang === currentLang) return;

  const resources = {
    en: { translation: locales.en },
    zh: { translation: locales.zh },
  };

  if (!initialized) {
    // First initialization: use synchronous in-memory init
    i18next.init(
      {
        lng: lang,
        fallbackLng: 'en',
        resources,
        interpolation: { escapeValue: false },
        initImmediate: false,
      },
      () => { /* synchronous callback */ },
    );
    initialized = true;
  } else {
    // Subsequent language changes: update resources and re-init synchronously
    // by resetting i18next internals via the store
    i18next.addResourceBundle('en', 'translation', locales.en, true, true);
    i18next.addResourceBundle('zh', 'translation', locales.zh, true, true);
    // changeLanguage with initImmediate:false resources resolves synchronously
    let done = false;
    i18next.changeLanguage(lang, () => { done = true; });
    // If not done synchronously (defensive), force language via store
    if (!done) {
      // Ensure the store is set correctly by using the global instance
      (i18next as any).language = lang;
      (i18next as any).languages = [lang, 'en'];
    }
  }
  currentLang = lang;
}

export function t(key: string, vars?: Record<string, unknown> | string): string {
  if (typeof vars === 'string') {
    // backward-compat: t(key, defaultValue) string form
    return i18next.t(key, vars) as string;
  }
  if (vars !== undefined) {
    return i18next.t(key, vars) as string;
  }
  return i18next.t(key, key) as string;
}
