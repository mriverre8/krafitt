'use client';

import { skipDay } from '@/app/actions';
import { useT } from '@/i18n/use-t';
import { Flag } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';

/**
 * Ending the time a workout is under way, wherever it is shown: on the home
 * screen and on the workout's own page. Done in full, it simply ends; half
 * done, it asks first, since the blanks stay blank; with nothing logged, it
 * says that the time is called off rather than counted (see `skipDay`).
 */
export function FinishWorkoutButton({
    routineId,
    done,
    total,
    className,
}: {
    routineId: string;
    /** Sets of this time logged so far, of how many there are. */
    done: number;
    total: number;
    className?: string;
}) {
    const t = useT();
    const complete = total > 0 && done === total;
    const empty = done === 0;

    return (
        <ActionButton
            action={() => skipDay(routineId)}
            confirm={
                complete
                    ? undefined
                    : {
                          title: t('today.finish'),
                          message: t(
                              empty
                                  ? 'today.finishEmptyConfirm'
                                  : 'today.finishConfirm'
                          ),
                          confirmLabel: t('today.finishAnyway'),
                      }
            }
            success={t(
                empty ? 'toast.workoutCancelled' : 'toast.workoutFinished'
            )}
            className={className}
        >
            <Flag
                size={14}
                aria-hidden
            />
            {t('today.finish')}
        </ActionButton>
    );
}
