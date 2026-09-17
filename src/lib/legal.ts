import { DEFAULT_LOCALE, type Locale, type TKey  } from '@/i18n/config';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** The whole route: three documents, one page. The whitelist is also what
    stops `doc` from walking out of the folder — it is spliced into a path. */
export const DOCS = {
    privacy: 'legal.privacy',
    terms: 'legal.terms',
    cookies: 'legal.cookies',
} as const satisfies Record<string, TKey>;

type Doc = keyof typeof DOCS;

export function isDoc(value: string): value is Doc {
    return value in DOCS;
}

/** One copy of the text per language — there is no way around that; the only
    question was where the copies live. English is the source of truth, and a
    language without its own file falls back to it rather than 500ing, so
    adding a fourth locale never has to land with its policies already
    written. */
export async function readDoc(doc: Doc, locale: Locale) {
    const path = (folder: string) =>
        join(process.cwd(), 'content', 'legal', folder, `${doc}.md`);
    try {
        return await readFile(path(locale), 'utf8');
    } catch {
        return readFile(path(DEFAULT_LOCALE), 'utf8');
    }
}