'use client';

import { useT } from '@/i18n/use-t';
import { badgeClass, cardLinkClass } from '@/lib/ui';
import { CircleCheck, Flame } from 'lucide-react';
import Link from 'next/link';
import { ProgressLadder } from './progress-ladder';

export type RoutineSummaryProps = {
    id: string;
    name: string;
    durationWeeks: number;
    workoutCount: number;
    cursor: number;
    state: 'active' | 'finished';
};

/**
 * A routine as the profile shows it: what it is and how far it got, with no way
 * to change it. The list at /routines is the place that activates and deletes;
 * here the whole card is one link into the routine.
 */
export function RoutineSummary(props: RoutineSummaryProps) {
    const t = useT();
    const total = props.workoutCount * props.durationWeeks;
    const done = Math.min(props.cursor, total);
    const progress = t('routines.progress', { done, total });
    const active = props.state === 'active';

    return (
        <Link
            href={`/routines/${props.id}`}
            // Same volt edge the active routine wears in the list, so the one
            // being trained reads the same wherever it turns up.
            className={`${cardLinkClass} block ${
                active ? 'border-l-volt border-l-[6px]' : ''
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="display truncate text-3xl">{props.name}</p>
                    <p className="eyebrow text-muted mt-1.5">
                        {t('routines.meta', {
                            weeks: props.durationWeeks,
                            days: props.workoutCount,
                        })}
                    </p>
                </div>
                {active ? (
                    <span
                        className={`${badgeClass} bg-volt text-on-volt shrink-0`}
                    >
                        <Flame
                            size={13}
                            aria-hidden
                        />
                        {t('routines.active')}
                    </span>
                ) : (
                    <span
                        className={`${badgeClass} border-line text-muted shrink-0 border-2`}
                    >
                        <CircleCheck
                            size={13}
                            aria-hidden
                        />
                        {t('routines.finished')}
                    </span>
                )}
            </div>

            <div className="mt-5 space-y-2">
                <ProgressLadder
                    done={done}
                    total={total}
                    label={progress}
                />
                <p className="figure text-muted text-sm">{progress}</p>
            </div>
        </Link>
    );
}
