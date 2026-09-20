'use client';

import { useT } from '@/i18n/use-t';
import { DEFAULT_EFFORT, type Effort } from '@/lib/progress';
import { EFFORT_ICON, EFFORT_SAID, EFFORT_WORD } from '@/lib/effort';

const COLOUR = {
    fail: 'text-danger',
    hard: 'text-draft-ink',
    easy: 'text-surge-ink',
} as const;

export function EffortMark({
    effort,
    faint,
}: {
    effort: Effort;
    faint?: boolean;
}) {
    const t = useT();
    if (effort === DEFAULT_EFFORT) return null;
    const Icon = EFFORT_ICON[effort];
    return (
        <span
            className={`eyebrow pointer-events-none absolute top-1 left-1.25 inline-flex items-center gap-1 md:left-2 ${COLOUR[effort]} ${faint ? 'opacity-50' : ''}`}
        >
            <span className="sr-only">{t(EFFORT_SAID[effort])}</span>
            <Icon
                size={11}
                aria-hidden
                className="md:hidden"
            />
            <span
                aria-hidden
                className="hidden md:inline"
            >
                {t(EFFORT_WORD[effort])}
            </span>
        </span>
    );
}
