'use client';

import { useT } from '@/i18n/use-t';
import { ghostClass, primaryClass } from '@/lib/ui';
import { ClipboardList, Dumbbell, Zap } from 'lucide-react';
import Link from 'next/link';

/** The home screen with nothing on it to train: a workout or a routine puts
    something there, so it offers the way to both — workouts first, as the
    navigation has them. */
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
            <div className="mt-7 flex flex-wrap gap-2">
                <Link
                    href="/workouts"
                    className={`${primaryClass} inline-flex items-center gap-2`}
                >
                    <Zap
                        size={16}
                        aria-hidden
                    />
                    {t('home.goToWorkouts')}
                </Link>
                <Link
                    href="/routines"
                    className={`${ghostClass} inline-flex items-center gap-2`}
                >
                    <ClipboardList
                        size={16}
                        aria-hidden
                    />
                    {t('home.goToRoutines')}
                </Link>
            </div>
        </div>
    );
}
