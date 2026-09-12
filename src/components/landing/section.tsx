'use client';

/**
 * One block of the landing page. The gradient hairline is the same one under
 * the app's own header, so the sections read as parts of the product rather
 * than as marketing laid on top of it.
 */

import type { TKey } from '@/i18n/config';
import { useT } from '@/i18n/use-t';
import type { ReactNode } from 'react';

export function Section({
    id,
    eyebrow,
    title,
    lead,
    note,
    children,
}: {
    id: string;
    eyebrow: TKey;
    title: TKey;
    lead: TKey;
    note?: TKey;
    children: ReactNode;
}) {
    const t = useT();

    return (
        <section
            id={id}
            aria-labelledby={`${id}-title`}
            className="scroll-mt-24 space-y-5"
        >
            <div className="reveal space-y-3">
                <p className="eyebrow text-pulse">{t(eyebrow)}</p>
                <h2
                    id={`${id}-title`}
                    className="display text-5xl sm:text-6xl"
                >
                    {t(title)}
                </h2>
                <p className="text-muted max-w-xl text-base text-pretty">
                    {t(lead)}
                </p>
                {note && (
                    <p className="text-muted max-w-xl text-sm text-pretty">
                        {t(note)}
                    </p>
                )}
                <div
                    aria-hidden
                    className="from-volt via-pulse h-px bg-linear-to-r to-transparent opacity-60"
                />
            </div>
            {children}
        </section>
    );
}
