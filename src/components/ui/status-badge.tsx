'use client';

import { useT } from '@/i18n/use-t';
import type { RoutineKind, RoutineStatus } from '@/lib/progress';
import { badgeClass } from '@/lib/ui';
import { CircleCheck, Flame } from 'lucide-react';

/** The look of each status. Pending is the plain one: nothing is happening,
    and nothing is missing. */
const looks = {
    finished: 'border-surge text-surge border-2',
    active: 'bg-volt text-on-volt',
    pending: 'border-line text-muted border-2',
    incomplete: 'border-line text-muted border-2 border-dashed',
} satisfies Record<RoutineStatus, string>;

/**
 * The one badge a routine or a workout wears. Worded by kind as well as by
 * status: they differ in more than the noun — "Incompleta" is a routine,
 * "Incompleto" a workout — and a workout in progress is not "active".
 */
export function StatusBadge({
    status,
    kind,
}: {
    status: RoutineStatus;
    kind: RoutineKind;
}) {
    const t = useT();
    const Icon =
        status === 'finished'
            ? CircleCheck
            : status === 'active'
              ? Flame
              : null;
    // A workout is never finished, so `workouts.finished` does not exist.
    const label =
        kind === 'workout' && status !== 'finished'
            ? t(`workouts.${status}`)
            : t(`routines.${status}`);

    return (
        <span className={`${badgeClass} ${looks[status]} shrink-0`}>
            {Icon && (
                <Icon
                    size={13}
                    aria-hidden
                />
            )}
            {label}
        </span>
    );
}
