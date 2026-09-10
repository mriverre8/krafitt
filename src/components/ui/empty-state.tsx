'use client';

import { useT } from '@/i18n/use-t';
import { primaryClass } from '@/lib/ui';
import { Dumbbell } from 'lucide-react';
import Link from 'next/link';

export function EmptyState({ title, body }: { title: string; body: string }) {
    const t = useT();

    return (
        <div className="border-line border-l-volt bg-surface rounded-md border border-l-[3px] p-8">
            <span className="bg-volt text-on-volt grid h-11 w-11 place-items-center rounded-md">
                <Dumbbell
                    size={24}
                    aria-hidden
                />
            </span>
            <h1 className="display mt-4 text-5xl">{title}</h1>
            <p className="text-muted mt-3 max-w-sm text-base">{body}</p>
            <Link
                href="/routines"
                className={`${primaryClass} mt-7 inline-block`}
            >
                {t('home.goToRoutines')}
            </Link>
        </div>
    );
}
