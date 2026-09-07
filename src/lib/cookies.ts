const ONE_YEAR = 60 * 60 * 24 * 365;

/** Client-side preference cookie (theme, locale). Read back on the server. */
export function setPreferenceCookie(name: string, value: string) {
    document.cookie = `${name}=${value}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
}
