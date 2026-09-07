'use client';

import { useT } from '@/i18n/use-t';
import { CalendarDays, ClipboardList, Dumbbell } from 'lucide-react';
import { AuthForms } from './auth-forms';

const FEATURES = [
    ['landing.feature1', ClipboardList],
    ['landing.feature2', CalendarDays],
    ['landing.feature3', Dumbbell],
] as const;

export function Landing() {
    const t = useT();

    return (
        <div className="space-y-10 py-6">
            <div className="space-y-3">
                <h1 className="display text-7xl leading-[0.85]">
                    Kra<span className="text-blaze">fitt</span>
                </h1>
                <p className="text-muted max-w-sm text-lg">
                    {t('app.tagline')}
                </p>
            </div>

            <ul className="grid gap-4">
                {FEATURES.map(([key, Icon]) => (
                    <li
                        key={key}
                        className="flex gap-3 text-base"
                    >
                        <Icon
                            size={20}
                            aria-hidden
                            className="text-blaze mt-0.5 shrink-0"
                        />
                        <span className="text-muted">{t(key)}</span>
                    </li>
                ))}
            </ul>

            <AuthForms />
        </div>
    );
}
