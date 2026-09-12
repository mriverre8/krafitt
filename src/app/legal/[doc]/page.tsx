import { BackButton } from '@/components/ui/back-button';
import { DEFAULT_LOCALE, type Locale, type TKey } from '@/i18n/config';
import { getLocale, getT } from '@/i18n/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import Markdown from 'react-markdown';

/** The whole route: three documents, one page. The whitelist is also what
    stops `doc` from walking out of the folder — it is spliced into a path. */
const DOCS = {
    privacy: 'legal.privacy',
    terms: 'legal.terms',
    cookies: 'legal.cookies',
} as const satisfies Record<string, TKey>;

type Doc = keyof typeof DOCS;

function isDoc(value: string): value is Doc {
    return value in DOCS;
}

/** One copy of the text per language — there is no way around that; the only
    question was where the copies live. English is the source of truth, and a
    language without its own file falls back to it rather than 500ing, so
    adding a fourth locale never has to land with its policies already
    written. */
async function readDoc(doc: Doc, locale: Locale) {
    const path = (folder: string) =>
        join(process.cwd(), 'content', 'legal', folder, `${doc}.md`);
    try {
        return await readFile(path(locale), 'utf8');
    } catch {
        return readFile(path(DEFAULT_LOCALE), 'utf8');
    }
}

export async function generateMetadata({
    params,
}: PageProps<'/legal/[doc]'>): Promise<Metadata> {
    const { doc } = await params;
    if (!isDoc(doc)) return {};
    return { title: `${(await getT())(DOCS[doc])} · Krafitt` };
}

export default async function LegalPage({ params }: PageProps<'/legal/[doc]'>) {
    const { doc } = await params;
    if (!isDoc(doc)) notFound();

    const [source, t] = await Promise.all([
        getLocale().then((locale) => readDoc(doc, locale)),
        getT(),
    ]);

    return (
        <div className="space-y-6">
            <header>
                <BackButton fallback="/" />
                <h1 className="display mt-5 text-5xl md:text-6xl">
                    {t(DOCS[doc])}
                </h1>
            </header>
            <article className="markdown">
                <Markdown>{source}</Markdown>
            </article>
        </div>
    );
}
