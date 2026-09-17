import { LOCALES } from '@/i18n/config';
import { DOCS } from '@/lib/legal';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// DOCS ties the footer links to the page, but nothing ties either to the .md
// files on disk — the page reads one named after the slug, in a folder named
// after the current locale. So a renamed or missing file is a 500 nobody sees
// until production, and a locale added without its translations would
// silently serve English forever.
const docs = Object.keys(DOCS);

const cases = LOCALES.flatMap((locale) =>
    docs.map((doc) => [locale, doc] as const)
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
