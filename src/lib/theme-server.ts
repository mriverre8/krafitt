import { cookies } from 'next/headers';
import { DEFAULT_THEME, isTheme, THEME_COOKIE, type Theme } from './theme';

/**
 * Read on the server so the <html> class is right in the first paint.
 * No blocking inline script, no flash of the wrong theme.
 */
export async function getTheme(): Promise<Theme> {
    const value = (await cookies()).get(THEME_COOKIE)?.value;
    return isTheme(value) ? value : DEFAULT_THEME;
}
