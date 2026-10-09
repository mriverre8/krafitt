'use client';

import { useT } from '@/i18n/use-t';
import { routineStatus, type Duration } from '@/lib/progress';
import { badgeClass, cardLinkClass } from '@/lib/ui';
import { CircleCheck, Flame } from 'lucide-react';
import Link from 'next/link';
import { ProgressLadder } from '@/components/ui/progress-ladder';

export type RoutineCardProps = {
    id: string;
    name: string;
    durationWeeks: Duration;
    workoutCount: number;
    cursor: number;
    isActive: boolean;
    finished: boolean;
    canActivate: boolean;
};

export function RoutineCard(props: RoutineCardProps) {
    const t = useT();
    const total =
        props.durationWeeks === null
            ? null
            : props.workoutCount * props.durationWeeks;
    const done = total === null ? props.cursor : Math.min(props.cursor, total);
    const progress =
        total === null
            ? t('routines.progressOpen', { done })
            : t('routines.progress', { done, total });

    const status = routineStatus(props);
    const training = status === 'active';

    return (
        <Link
            href={`/routines/${props.id}`}
            className={`${cardLinkClass} block ${
                training ? 'border-l-volt border-l-[6px]' : ''
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="display truncate text-3xl">{props.name}</p>
                    <p className="eyebrow text-muted mt-1.5">
                        {props.durationWeeks === null
                            ? t('routines.metaOpen', {
                                  days: props.workoutCount,
                              })
                            : t('routines.meta', {
                                  weeks: props.durationWeeks,
                                  days: props.workoutCount,
                              })}
                    </p>
                </div>

                {status === 'finished' ? (
                    <span
                        className={`${badgeClass} border-surge text-surge shrink-0 border-2`}
                    >
                        <CircleCheck
                            size={13}
                            aria-hidden
                        />
                        {t('routines.finished')}
                    </span>
                ) : status === 'active' ? (
                    <span
                        className={`${badgeClass} bg-volt text-on-volt shrink-0`}
                    >
                        <Flame
                            size={13}
                            aria-hidden
                        />
                        {t('routines.active')}
                    </span>
                ) : status === 'pending' ? (
                    <span
                        className={`${badgeClass} border-line text-muted shrink-0 border-2`}
                    >
                        {t('routines.pending')}
                    </span>
                ) : (
                    <span
                        className={`${badgeClass} border-line text-muted shrink-0 border-2 border-dashed`}
                    >
                        {t('routines.incomplete')}
                    </span>
                )}
            </div>

            <div className="mt-5 space-y-2">
                {total !== null && (
                    <ProgressLadder
                        done={done}
                        total={total}
                        label={progress}
                    />
                )}
                <p className="figure text-muted text-sm">{progress}</p>
            </div>
        </Link>
    );
}
