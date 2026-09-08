'use client';

import { useT } from '@/i18n/use-t';
import { badgeClass, cardLinkClass } from '@/lib/ui';
import { Flame } from 'lucide-react';
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
    onSetActive: (routineId: string) => Promise<void>;
};

export function RoutineCard(props: RoutineCardProps) {
    const t = useT();
    const total = props.workoutCount * props.durationWeeks;
    const done = Math.min(props.cursor, total);
    const progress = t('routines.progress', { done, total });

    // The active routine is the only card with a volt edge: one lit card in the
    // list, so the eye lands on it before reading a word.
    return (
        <li
            className={`${cardLinkClass} ${
                props.isActive ? 'border-l-volt border-l-[6px]' : ''
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

                {props.isActive ? (
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
                    <ActionButton
                        action={() => props.onSetActive(props.id)}
                        className={`${badgeClass} lift border-line text-muted hover:border-pulse hover:text-pulse shrink-0 border-2`}
                    >
                        {t('routines.markActive')}
                    </ActionButton>
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
