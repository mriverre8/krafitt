import { cookies, headers } from 'next/headers';
import {
    createT,
    dictionaries,
    DEFAULT_LOCALE,
    isLocale,
    LOCALE_COOKIE,
    LOCALES,
    type Locale,
} from './config';

/** Cookie first, then the browser's Accept-Language, then English. */
export async function getLocale(): Promise<Locale> {
    const fromCookie = (await cookies()).get(LOCALE_COOKIE)?.value;
    if (isLocale(fromCookie)) return fromCookie;

    const accepted = (await headers()).get('accept-language') ?? '';
    const preferred = accepted
        .split(',')
        .map((part) => part.split(';')[0].trim().slice(0, 2).toLowerCase());
    return (
        preferred.find((code): code is Locale =>
            LOCALES.includes(code as Locale)
        ) ?? DEFAULT_LOCALE
    );
}

export async function getDictionary() {
    return dictionaries[await getLocale()];
}

/** Translator for server components and server actions. */
export async function getT() {
    return createT(await getDictionary());
}
