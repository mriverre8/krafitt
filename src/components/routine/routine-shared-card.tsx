'use client';

import { useT } from '@/i18n/use-t';
import type { Duration } from '@/lib/progress';
import type { Grant } from '@/lib/roles';
import { badgeClass, cardLinkClass } from '@/lib/ui';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';
import { ProgressLadder } from '@/components/ui/progress-ladder';

export type RoutineSharedCardProps = {
    id: string;
    name: string;
    durationWeeks: Duration;
    workoutCount: number;
    cursor: number;
    ownerName: string;
    ownerImage: string | null;
    role: Grant;
};

export function RoutineSharedCard(props: RoutineSharedCardProps) {
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

    return (
        <Link
            href={`/routines/${props.id}`}
            className={`${cardLinkClass} block`}
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
                    <p className="text-muted mt-2 flex items-center gap-1.5 text-sm">
                        <Avatar
                            name={props.ownerName}
                            src={props.ownerImage}
                            className="size-5 text-[9px]"
                        />
                        <span className="truncate">
                            {t('routine.by', { name: props.ownerName })}
                        </span>
                    </p>
                </div>

                {props.role && (
                    <span
                        className={`${badgeClass} border-pulse text-pulse shrink-0 border-2`}
                    >
                        {t(`role.${props.role}`)}
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
