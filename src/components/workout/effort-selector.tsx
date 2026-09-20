'use client';

import { useT } from '@/i18n/use-t';
import { EFFORTS, type Effort } from '@/lib/progress';
import { EFFORT_ICON, EFFORT_SAID, EFFORT_WORD } from '@/lib/effort';

const PICKED = {
    fail: 'bg-danger text-on-danger',
    hard: 'bg-draft text-on-draft',
    normal: 'bg-muted text-surface',
    easy: 'bg-surge text-on-surge',
} as const;

export function EffortSelector({
    name,
    value,
    onChange,
}: {
    name: string;
    value: Effort;
    onChange: (effort: Effort) => void;
}) {
    const t = useT();

    return (
        <div
            role="radiogroup"
            aria-label={t('today.effortLabel', { n: name })}
            className="slot-in border-line divide-line bg-surface2 flex h-12 w-full min-w-0 divide-x-2 overflow-hidden rounded-md border-2"
        >
            {EFFORTS.map((option) => {
                const Icon = EFFORT_ICON[option];
                const on = option === value;
                return (
                    <button
                        key={option}
                        autoFocus={on}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        aria-label={t(EFFORT_SAID[option])}
                        onClick={() => onChange(option)}
                        className={`eyebrow flex min-w-0 flex-1 items-center justify-center gap-1.5 transition-colors ${
                            on
                                ? PICKED[option]
                                : 'text-muted hover:bg-surface hover:text-ink'
                        }`}
                    >
                        <Icon
                            size={16}
                            aria-hidden
                        />
                        <span
                            aria-hidden
                            className="hidden truncate md:inline"
                        >
                            {t(EFFORT_WORD[option])}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
