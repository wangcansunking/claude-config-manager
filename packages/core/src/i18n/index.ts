import en from './locales/en.json' with { type: 'json' };
import zh from './locales/zh.json' with { type: 'json' };

export type SupportedLanguage = 'en' | 'zh';
export const supportedLanguages: SupportedLanguage[] = ['en', 'zh'];

export const locales = { en, zh } as const;

export function getResource(lang: SupportedLanguage): typeof en {
  return locales[lang] ?? locales.en;
}
