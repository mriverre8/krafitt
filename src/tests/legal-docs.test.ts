import { LOCALES } from '@/i18n/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The footer links to three routes and the page reads a file named after each
// one, in a folder named after the current locale. Nothing in TypeScript ties
// those together, so a renamed or missing .md is a 500 nobody sees until
// production — and a locale added without its translations would silently
// serve English forever.
const DOCS = ['privacy', 'terms', 'cookies'];

const cases = LOCALES.flatMap((locale) =>
    DOCS.map((doc) => [locale, doc] as const)
);

describe('legal docs', () => {
    it.each(cases)('%s/%s.md exists and has content', (locale, doc) => {
        const source = readFileSync(
            join(process.cwd(), 'content', 'legal', locale, `${doc}.md`),
            'utf8'
        );
        expect(source.trim().length).toBeGreaterThan(200);
    });
});
