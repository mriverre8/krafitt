export const THEMES = ['dark', 'light'] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_COOKIE = 'krafitt.theme';
export const DEFAULT_THEME: Theme = 'dark';

export function isTheme(value: unknown): value is Theme {
    return THEMES.includes(value as Theme);
}
