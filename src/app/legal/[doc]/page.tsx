import { BackButton } from '@/components/ui/back-button';
import { getLocale, getT } from '@/i18n/server';
import { DOCS, isDoc, readDoc } from '@/lib/legal';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Markdown from 'react-markdown';

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
