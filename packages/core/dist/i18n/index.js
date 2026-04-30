import en from './locales/en.json' with { type: 'json' };
import zh from './locales/zh.json' with { type: 'json' };
export const supportedLanguages = ['en', 'zh'];
export const locales = { en, zh };
export function getResource(lang) {
    return locales[lang] ?? locales.en;
}
//# sourceMappingURL=index.js.map