'use client';

import { useT } from '@/i18n/use-t';
import { badgeClass, cardLinkClass } from '@/lib/ui';
import { CircleCheck, Flame } from 'lucide-react';
import Link from 'next/link';
import { ProgressLadder } from '@/components/ui/progress-ladder';

export type RoutineCardProps = {
    id: string;
    name: string;
    durationWeeks: number;
    workoutCount: number;
    cursor: number;
    isActive: boolean;
    finished: boolean;
    canActivate: boolean;
};

export function RoutineCard(props: RoutineCardProps) {
    const t = useT();
    const total = props.workoutCount * props.durationWeeks;
    const done = Math.min(props.cursor, total);
    const progress = t('routines.progress', { done, total });

    const training = props.isActive && !props.finished;

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
                        {t('routines.meta', {
                            weeks: props.durationWeeks,
                            days: props.workoutCount,
                        })}
                    </p>
                </div>

                {props.finished ? (
                    <span
                        className={`${badgeClass} border-surge text-surge shrink-0 border-2`}
                    >
                        <CircleCheck
                            size={13}
                            aria-hidden
                        />
                        {t('routines.finished')}
                    </span>
                ) : props.isActive ? (
                    <span
                        className={`${badgeClass} bg-volt text-on-volt shrink-0`}
                    >
                        <Flame
                            size={13}
                            aria-hidden
                        />
                        {t('routines.active')}
                    </span>
                ) : props.canActivate ? (
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
