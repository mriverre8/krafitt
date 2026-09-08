'use client';

import { useT } from '@/i18n/use-t';
import { CalendarDays, ClipboardList, Dumbbell } from 'lucide-react';
import { AuthForms } from './auth-forms';
import { Wordmark } from './wordmark';

const FEATURES = [
    ['landing.feature1', ClipboardList],
    ['landing.feature2', CalendarDays],
    ['landing.feature3', Dumbbell],
] as const;

export function Landing() {
    const t = useT();

    return (
        <div className="space-y-12 py-4">
            <div className="space-y-4">
                {/* The mark runs to the edge of the column: at this size it is
                    the page's only image, so it gets the room of one. */}
                <h1 className="text-7xl sm:text-8xl">
                    <Wordmark />
                </h1>
                <p className="text-ink max-w-md text-xl font-medium text-balance">
                    {t('app.tagline')}
                </p>
            </div>

            <ul className="grid gap-3">
                {FEATURES.map(([key, Icon], index) => (
                    <li
                        key={key}
                        className="border-line flex items-start gap-4 rounded-md border p-4"
                    >
                        {/* Volt only ever appears as a fill, never as a numeral
                            in mid-air: on white it would land at 2:1. */}
                        <span
                            aria-hidden
                            className="figure bg-volt text-on-volt grid h-7 w-7 shrink-0 place-items-center rounded-sm text-base leading-none"
                        >
                            {index + 1}
                        </span>
                        <Icon
                            size={20}
                            aria-hidden
                            className="text-pulse mt-0.5 shrink-0"
                        />
                        <span className="text-muted text-base">{t(key)}</span>
                    </li>
                ))}
            </ul>

            <AuthForms />
        </div>
    );
}
