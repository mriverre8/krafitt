import { ca } from './ca';
import { en, type Dict, type TKey } from './en';
import { es } from './es';

export const LOCALES = ['en', 'es', 'ca'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_COOKIE = 'krafitt.locale';
export const DEFAULT_LOCALE: Locale = 'en';

export const dictionaries: Record<Locale, Dict> = { en, es, ca };

export function isLocale(value: unknown): value is Locale {
    return LOCALES.includes(value as Locale);
}

/**
 * Replaces {placeholders} with the given params, and {key|one|other} with
 * `one` when params[key] is 1 and `other` otherwise.
 *
 * ponytail: "exactly 1 is singular" holds for en, es and ca only; a locale
 * with other plural rules needs `Intl.PluralRules` here.
 */
export function interpolate(
    template: string,
    params?: Record<string, string | number>
) {
    if (!params) return template;
    return template.replace(
        /\{(\w+)(?:\|([^|}]*)\|([^|}]*))?\}/g,
        (match, key: string, one?: string, other?: string) => {
            if (!(key in params)) return match;
            if (one === undefined) return String(params[key]);
            return params[key] === 1 ? one : other!;
        }
    );
}

export function createT(dict: Dict) {
    return (key: TKey, params?: Record<string, string | number>) =>
        interpolate(dict[key], params);
}

export type Translate = ReturnType<typeof createT>;
export type { Dict, TKey };
