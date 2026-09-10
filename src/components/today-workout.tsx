'use client';

import { logSet, skipDay } from '@/app/actions';
import { useT } from '@/i18n/use-t';
import {
    flatSets,
    isSetEnabled,
    isSetFilled,
    type Logs,
    type PreviousLogs,
} from '@/lib/progress';
import { ghostClass } from '@/lib/ui';
import { ProgressLadder } from './progress-ladder';
import { useSessionStore } from '@/store/session';
import { SkipForward } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { showModal } from '@/store/modal';
import { FormError } from './form-error';
import { WorkoutExercise, type ExerciseView } from './workout-exercise';

export type TodayWorkoutProps = {
    routineId: string;
    routineName: string;
    week: number;
    totalWeeks: number;
    workout: { id: string; name: string; exercises: ExerciseView[] };
    logs: Logs;
    previous: PreviousLogs;
};

export function TodayWorkout(props: TodayWorkoutProps) {
    const { routineId, routineName, week, totalWeeks, workout, previous } =
        props;
    const t = useT();
    const router = useRouter();
    const { logs, hydrate } = useSessionStore();
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | undefined>();

    useEffect(() => {
        hydrate(props.logs);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.logs, workout.id]);

    function run(operation: () => Promise<unknown>) {
        startTransition(async () => {
            setError(undefined);
            try {
                await operation();
            } catch (cause) {
                setError(
                    cause instanceof Error
                        ? cause.message
                        : t('today.genericError')
                );
            }
        });
    }

    // How much of today is banked. Derived, never stored: the store already
    // holds the only copy of the logs.
    const all = flatSets(workout.exercises);
    const doneSets = all.filter((s) =>
        isSetFilled(logs, s.exerciseId, s.setIndex)
    ).length;
    // The day stays on screen after the last set, so the counter says so instead
    // of reading n/n.
    const complete = all.length > 0 && doneSets === all.length;
    const sessionProgress = complete
        ? t('today.done')
        : t('today.progress', { done: doneSets, total: all.length });

    // A finished day is already behind us: the next fetch moves the cursor past
    // it on its own, so skipping it too would cost the user the day after.
    // Anything else is a real skip, and the sets left blank are lost for good.
    function onSkip() {
        if (complete) return router.refresh();
        showModal('confirm', {
            title: t('today.skipTitle'),
            message: t('today.skipConfirm'),
            confirmLabel: t('today.skipAnyway'),
            onConfirm: () => run(() => skipDay(routineId)),
        });
    }

    return (
        <div className="space-y-4">
            <header className="border-line border-l-volt bg-surface space-y-5 rounded-md border border-l-[6px] p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="eyebrow text-muted truncate">
                            {routineName}
                        </p>
                        <h1 className="display text-ink mt-2 text-6xl">
                            {workout.name}
                        </h1>
                    </div>
                    <p className="bg-volt text-on-volt figure grid shrink-0 place-items-center rounded-md px-3 py-2 leading-none">
                        <span className="sr-only">
                            {t('today.week', { week, total: totalWeeks })}
                        </span>
                        <span
                            aria-hidden
                            className="text-4xl"
                        >
                            {week}
                        </span>
                        <span
                            aria-hidden
                            className="eyebrow mt-1 opacity-70"
                        >
                            / {totalWeeks}
                        </span>
                    </p>
                </div>

                {all.length > 0 && (
                    <div className="space-y-2">
                        <ProgressLadder
                            done={doneSets}
                            total={all.length}
                            label={sessionProgress}
                        />
                        <p className="figure text-muted text-sm">
                            {sessionProgress}
                        </p>
                    </div>
                )}
            </header>

            <FormError message={error} />

            {workout.exercises.length === 0 && (
                <p className="border-line text-muted rounded-md border-2 border-dashed p-6 text-center text-sm">
                    {t('today.noExercises')}
                </p>
            )}

            {workout.exercises.map((exercise) => (
                <WorkoutExercise
                    key={exercise.id}
                    exercise={exercise}
                    logs={logs[exercise.id] ?? {}}
                    previous={previous[exercise.id] ?? {}}
                    isSetEnabled={(setIndex) =>
                        !pending &&
                        isSetEnabled(
                            workout.exercises,
                            logs,
                            exercise.id,
                            setIndex
                        )
                    }
                    onSaveSet={(setIndex, weight, reps) =>
                        run(async () => {
                            await logSet(
                                workout.id,
                                week,
                                exercise.id,
                                setIndex,
                                weight,
                                reps
                            );
                            useSessionStore
                                .getState()
                                .save(exercise.id, setIndex, { weight, reps });
                        })
                    }
                />
            ))}

            <button
                type="button"
                disabled={pending}
                onClick={onSkip}
                className={`${ghostClass} flex w-full items-center justify-center gap-2`}
            >
                <SkipForward
                    size={14}
                    aria-hidden
                />
                {t('today.skip')}
            </button>
        </div>
    );
}
