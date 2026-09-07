'use client';

import { useT } from '@/i18n/use-t';
import { primaryClass } from '@/lib/ui';
import { Dumbbell } from 'lucide-react';
import Link from 'next/link';

export function EmptyState({ title, body }: { title: string; body: string }) {
    const t = useT();

    return (
        <div className="border-line bg-surface rounded-2xl border p-8">
            <Dumbbell
                size={28}
                aria-hidden
                className="text-blaze"
            />
            <h1 className="display mt-3 text-4xl">{title}</h1>
            <p className="text-muted mt-2 max-w-sm">{body}</p>
            <Link
                href="/routines"
                className={`${primaryClass} mt-6 inline-block`}
            >
                {t('home.goToRoutines')}
            </Link>
        </div>
    );
}
