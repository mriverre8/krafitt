import { ca } from "./ca";
import { en, type Dict, type TKey } from "./en";
import { es } from "./es";

export const LOCALES = ["en", "es", "ca"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_COOKIE = "krafitt.locale";
export const DEFAULT_LOCALE: Locale = "en";

export const dictionaries: Record<Locale, Dict> = { en, es, ca };

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

/** Replaces {placeholders} with the given params. */
export function interpolate(template: string, params?: Record<string, string | number>) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

export function createT(dict: Dict) {
  return (key: TKey, params?: Record<string, string | number>) =>
    interpolate(dict[key], params);
}

export type Translate = ReturnType<typeof createT>;
export type { Dict, TKey };
