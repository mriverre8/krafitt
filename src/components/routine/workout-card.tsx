'use client';

import { useT } from '@/i18n/use-t';
import type { RoutineStatus } from '@/lib/progress';
import { cardLinkClass } from '@/lib/ui';
import Link from 'next/link';
import { StatusBadge } from '@/components/ui/status-badge';

/** A workout in the list: what it is made of and how often it has been done.
    There is no progress to draw — it never runs out. */
export function WorkoutCard({
    id,
    name,
    exercises,
    times,
    status,
}: {
    id: string;
    name: string;
    exercises: number;
    /** The times it was done, which is where its cursor stands. */
    times: number;
    status: RoutineStatus;
}) {
    const t = useT();

    return (
        <Link
            href={`/workouts/${id}`}
            className={`${cardLinkClass} block ${
                status === 'active' ? 'border-l-volt border-l-[6px]' : ''
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="display truncate text-3xl">{name}</p>
                    <p className="eyebrow text-muted mt-1.5">
                        {t('workouts.meta', { exercises, times })}
                    </p>
                </div>
                <StatusBadge
                    status={status}
                    kind="workout"
                />
            </div>
        </Link>
    );
}
