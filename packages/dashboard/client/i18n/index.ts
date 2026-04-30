import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { locales } from '@ccm/core/i18n';

/**
 * Two-locale i18n for the dashboard UI. Detection order:
 *   1. localStorage key `ccm-lang` (set by the Sidebar language switcher)
 *   2. `navigator.language`
 *   3. fallback 'en'
 *
 * Error messages returned from the API are NOT routed through i18n — they're
 * server-side and pass through untouched.
 */
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: locales.en },
      zh: { translation: locales.zh },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'zh'],
    load: 'languageOnly', // map zh-CN / zh-TW → zh
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'ccm-lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
