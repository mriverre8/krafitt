'use client';

import { useT } from '@/i18n/use-t';
import { badgeClass, cardLinkClass } from '@/lib/ui';
import { CircleCheck, Flame } from 'lucide-react';
import Link from 'next/link';
import { ActionButton } from './action-button';
import { ProgressLadder } from './progress-ladder';

export type RoutineCardProps = {
    id: string;
    name: string;
    durationWeeks: number;
    workoutCount: number;
    cursor: number;
    isActive: boolean;
    /** Every week of it is behind the cursor: there is nothing left to train. */
    finished: boolean;
    /** A routine with holes in it cannot be trained, so it cannot go active. */
    canActivate: boolean;
    onSetActive: (routineId: string) => Promise<void>;
};

export function RoutineCard(props: RoutineCardProps) {
    const t = useT();
    const total = props.workoutCount * props.durationWeeks;
    const done = Math.min(props.cursor, total);
    const progress = t('routines.progress', { done, total });

    // The routine being trained is the only card with a volt edge: one lit card
    // in the list, so the eye lands on it before reading a word. A finished one
    // is not being trained any more, whatever its flag still says.
    const training = props.isActive && !props.finished;

    return (
        <li
            className={`${cardLinkClass} ${
                training ? 'border-l-volt border-l-[6px]' : ''
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <Link
                        href={`/routines/${props.id}`}
                        className="display hover:text-pulse text-3xl transition-colors"
                    >
                        {props.name}
                    </Link>
                    <p className="eyebrow text-muted mt-1.5">
                        {t('routines.meta', {
                            weeks: props.durationWeeks,
                            days: props.workoutCount,
                        })}
                    </p>
                </div>

                {props.finished ? (
                    <span
                        className={`${badgeClass} border-line text-muted shrink-0 border-2`}
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
                    <ActionButton
                        action={() => props.onSetActive(props.id)}
                        className={`${badgeClass} lift border-line text-muted hover:border-pulse hover:text-pulse shrink-0 border-2`}
                    >
                        {t('routines.markActive')}
                    </ActionButton>
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
        </li>
    );
}
