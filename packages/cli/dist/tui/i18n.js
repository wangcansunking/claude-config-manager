import i18next from 'i18next';
import { locales } from '@ccm/core/i18n';
let initialized = false;
export function initI18n(lang) {
    if (initialized) {
        void i18next.changeLanguage(lang);
        return;
    }
    void i18next.init({
        lng: lang,
        fallbackLng: 'en',
        resources: {
            en: { translation: locales.en },
            zh: { translation: locales.zh },
        },
        interpolation: { escapeValue: false },
    });
    initialized = true;
}
export function t(key, defaultValue) {
    return i18next.t(key, defaultValue ?? key);
}
//# sourceMappingURL=i18n.js.map