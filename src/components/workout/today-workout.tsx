'use client';

import {
    cancelDay,
    logSet,
    pickDay,
    skipDay,
    skipWeek,
    startDay,
} from '@/app/actions';
import { useT } from '@/i18n/use-t';
import { setSlots } from '@/lib/history';
import {
    flatSets,
    isSetEnabled,
    filledSets,
    isSetFilled,
    isSessionComplete,
    type Duration,
    type Logs,
    type PreviousLogs,
    type RoutineKind,
} from '@/lib/progress';
import { doneClass, ghostClass, primaryClass, stickyBarClass } from '@/lib/ui';
import { HistoryLink } from '@/components/ui/history-link';
import { ExercisePreview } from '@/components/workout/exercise-preview';
import { FinishWorkoutButton } from '@/components/workout/finish-workout-button';
import { ProgressLadder } from '@/components/ui/progress-ladder';
import { useSessionStore } from '@/store/session';
import {
    ArrowLeftRight,
    CircleCheck,
    Flag,
    Play,
    SkipForward,
} from 'lucide-react';
import { unstable_rethrow, useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';
import { showModal } from '@/store/modal';
import { toast } from '@/store/toast';
import {
    WorkoutExercise,
    type ExerciseView,
} from '@/components/workout/workout-exercise';

export type TodayWorkoutProps = {
    routineId: string;
    routineName: string;
    week: number;
    totalWeeks: Duration;
    workout: { id: string; name: string; exercises: ExerciseView[] };
    /** Where `workout` sits among the routine's days, counted from 0. */
    day: number;
    /** Whether the day is under way rather than being read: a routine's day
        is started from here, a workout on its page. */
    started?: boolean;
    logs: Logs;
    /** The sets a day taken up again had when it was left: shown, not
        edited, and not counted as done this time. */
    locked?: Logs;
    previous: PreviousLogs;
    /** The days of this week that can be trained instead, this one among them. */
    choices?: {
        id: string;
        name: string;
        index: number;
        incomplete: boolean;
    }[];
    /** A workout is one day done again and again: its "week" is which time
        this is, and it is finished rather than skipped. */
    kind?: RoutineKind;
};

export function TodayWorkout(props: TodayWorkoutProps) {
    const {
        routineId,
        routineName,
        week,
        totalWeeks,
        workout,
        day,
        previous,
        locked = {},
        kind = 'routine',
    } = props;
    const t = useT();
    const single = kind === 'workout';
    const router = useRouter();
    const { logs, hydrate } = useSessionStore();
    const [pending, startTransition] = useTransition();
    // A routine's day is read before it is trained, and stays under way until
    // it is finished: the server knows, by the session starting it opened. A
    // workout was started on its page.
    const started = single || props.started;

    // The store holds logs by position, and an edit to the plan moves sets
    // about: a day whose plan changed is a different day to the store, and is
    // loaded afresh rather than read in the old places.
    const plan = workout.exercises
        .map((exercise) => [exercise.id, ...setSlots(exercise.sets)].join(','))
        .join(';');
    useEffect(() => {
        hydrate(`${workout.id}:${week}:${plan}`, props.logs);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.logs, workout.id, week, plan]);

    // An expected failure comes back as `{ error }`; a thrown message never
    // reaches production intact, so a throw only ever reads as the generic one.
    function run(operation: () => Promise<{ error?: string } | void>) {
        startTransition(async () => {
            try {
                const result = await operation();
                if (result?.error) toast(result.error, 'error');
            } catch (cause) {
                unstable_rethrow(cause);
                toast(t('today.genericError'), 'error');
            }
        });
    }

    // How much of today is banked. Derived, never stored: the store already
    // holds the only copy of the logs.
    const all = flatSets(workout.exercises);
    const doneSets = filledSets(workout.exercises, logs);
    // The day stays on screen after the last set, so the counter says so instead
    // of reading n/n.
    const complete = all.length > 0 && doneSets === all.length;
    const sessionProgress = complete
        ? t('today.done')
        : t('today.progress', { done: doneSets, total: all.length });

    function onStart() {
        run(() => startDay(workout.id, week));
    }

    // A day done in full is behind us as it stands: the next fetch moves the
    // cursor past it, so there is nothing to finish, only to show.
    const done = started && complete;
    // Only before starting or once done: a day under way is finished or called
    // off first.
    const idle = !started || done;
    const choices = props.choices ?? [];
    // A day done in full is left out of the days to pick once it is closed.
    const canChangeDay = idle && choices.some((c) => c.id !== workout.id);
    // A day left incomplete is taken up again rather than started afresh.
    const incomplete = choices.some((c) => c.id === workout.id && c.incomplete);
    // The other days left incomplete, flagged on the button that reaches them.
    const pendingDays = choices.filter(
        (c) => c.id !== workout.id && c.incomplete
    ).length;
    const changeDayLabel =
        pendingDays > 0
            ? t('today.changeDayPending', { count: pendingDays })
            : t('today.changeDay');
    function onChangeDay() {
        showModal('pickDay', {
            // A day done in full is not one to pick, the one on screen neither.
            choices: done
                ? choices.filter((c) => c.id !== workout.id)
                : choices,
            current: workout.id,
            onPick: (workoutId) => run(() => pickDay(routineId, workoutId)),
        });
    }

    // The last day left of the week: once done there is nothing more to show
    // in it, and the next fetch moves on to the next week, or ends the routine.
    const lastOfWeek = !single && !choices.some((c) => c.id !== workout.id);

    // Skipping the last week of a routine with an end is finishing it.
    const lastWeek = totalWeeks !== null && week === totalWeeks;
    const skipWeekLabel = t(
        lastWeek ? 'today.finishRoutine' : 'today.skipWeek'
    );
    // The rest of the week is left not logged, for good: asked first.
    function onSkipWeek() {
        showModal('confirm', {
            title: skipWeekLabel,
            message: t(
                lastWeek
                    ? 'today.finishRoutineConfirm'
                    : 'today.skipWeekConfirm'
            ),
            confirmLabel: skipWeekLabel,
            onConfirm: () =>
                run(async () => {
                    const result = await skipWeek(routineId);
                    if (result) return result;
                    toast(
                        t(
                            lastWeek
                                ? 'toast.routineFinished'
                                : 'toast.weekSkipped'
                        )
                    );
                }),
        });
    }

    // With nothing logged there is nothing to end: once confirmed, it goes back
    // to being read. Anything else moves on, and the sets left blank are lost
    // for good. A workout has its own button, shared with its page.
    function onFinish() {
        // A day with no sets could never be logged, so it is moved past instead
        // of being read for ever. A day taken up again counts only what is new.
        if (
            doneSets === filledSets(workout.exercises, locked) &&
            all.length > 0
        ) {
            return showModal('confirm', {
                title: t('today.finish'),
                message: t('today.finishEmptyConfirm'),
                confirmLabel: t('today.finishAnyway'),
                onConfirm: () =>
                    run(async () => {
                        await cancelDay(workout.id, week);
                        toast(t('toast.workoutCancelled'));
                    }),
            });
        }
        showModal('confirm', {
            title: t('today.finish'),
            message: t('today.finishConfirm'),
            confirmLabel: t('today.finishAnyway'),
            onConfirm: () =>
                run(async () => {
                    await skipDay(routineId);
                    toast(t('toast.workoutFinished'));
                }),
        });
    }

    return (
        <div className="space-y-4">
            <header className="border-line border-l-volt bg-surface space-y-5 rounded-md border border-l-[6px] p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="eyebrow text-muted truncate">
                            {single ? t('today.workoutEyebrow') : routineName}
                        </p>
                        <h1 className="display text-ink mt-2 text-6xl">
                            {workout.name}
                        </h1>
                    </div>
                    <p className="bg-volt text-on-volt figure grid shrink-0 place-items-center rounded-md px-3 py-2 leading-none">
                        <span className="sr-only">
                            {single
                                ? t('today.run', { n: week })
                                : totalWeeks === null
                                  ? t('today.weekOpen', { week })
                                  : t('today.week', {
                                        week,
                                        total: totalWeeks,
                                    })}
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
                            {single
                                ? t('today.runColumn')
                                : totalWeeks === null
                                  ? t('progress.weekColumn')
                                  : `/ ${totalWeeks}`}
                        </span>
                    </p>
                </div>

                <div className="space-y-2">
                    {started && all.length > 0 && (
                        <ProgressLadder
                            done={doneSets}
                            total={all.length}
                            label={sessionProgress}
                        />
                    )}
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                        {started && all.length > 0 && (
                            <p className="figure text-muted text-sm">
                                {sessionProgress}
                            </p>
                        )}
                        <HistoryLink
                            routineId={routineId}
                            day={day}
                        />
                    </div>
                </div>
            </header>

            {workout.exercises.length === 0 && (
                <p className="border-line text-muted rounded-md border-2 border-dashed p-6 text-center text-sm">
                    {t('today.noExercises')}
                </p>
            )}

            {!started &&
                workout.exercises.map((exercise) => (
                    <ExercisePreview
                        key={exercise.id}
                        exercise={exercise}
                    />
                ))}

            {started &&
                workout.exercises.map((exercise) => (
                    <WorkoutExercise
                        key={`${week}:${exercise.id}`}
                        exercise={exercise}
                        logs={logs[exercise.id] ?? {}}
                        previous={previous[exercise.id] ?? {}}
                        isSetEnabled={(setIndex) =>
                            !pending &&
                            !done &&
                            !isSetFilled(locked, exercise.id, setIndex) &&
                            isSetEnabled(
                                workout.exercises,
                                logs,
                                exercise.id,
                                setIndex
                            )
                        }
                        onSaveSet={(setIndex, weight, reps, effort) =>
                            run(async () => {
                                const result = await logSet(
                                    workout.id,
                                    week,
                                    exercise.id,
                                    setSlots(exercise.sets)[setIndex],
                                    weight,
                                    reps,
                                    effort
                                );
                                if (result) return result;
                                useSessionStore
                                    .getState()
                                    .save(exercise.id, setIndex, {
                                        weight,
                                        reps,
                                        effort,
                                    });
                                // The last set of the week's last day: on to
                                // the next week, as finishing a workout does —
                                // or, in the last one, the routine ends.
                                if (
                                    lastOfWeek &&
                                    isSessionComplete(
                                        workout.exercises,
                                        useSessionStore.getState().logs
                                    )
                                ) {
                                    toast(
                                        t(
                                            lastWeek
                                                ? 'toast.routineFinished'
                                                : 'toast.workoutFinished'
                                        )
                                    );
                                    router.refresh();
                                }
                            })
                        }
                    />
                ))}

            <div className={stickyBarClass}>
                {canChangeDay && (
                    <button
                        type="button"
                        disabled={pending}
                        onClick={onChangeDay}
                        aria-label={changeDayLabel}
                        title={changeDayLabel}
                        className={`${ghostClass} relative flex shrink-0 items-center justify-center`}
                    >
                        <ArrowLeftRight
                            size={18}
                            aria-hidden
                        />
                        {pendingDays > 0 && (
                            <span
                                aria-hidden
                                className="bg-volt text-on-volt absolute -top-1.5 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[0.625rem] leading-none"
                            >
                                {pendingDays}
                            </span>
                        )}
                    </button>
                )}
                {!single && idle && (
                    <button
                        type="button"
                        disabled={pending}
                        onClick={onSkipWeek}
                        aria-label={skipWeekLabel}
                        title={skipWeekLabel}
                        className={`${ghostClass} flex shrink-0 items-center justify-center`}
                    >
                        {lastWeek ? (
                            <Flag
                                size={18}
                                aria-hidden
                            />
                        ) : (
                            <SkipForward
                                size={18}
                                aria-hidden
                            />
                        )}
                    </button>
                )}
                {single ? (
                    <FinishWorkoutButton
                        routineId={routineId}
                        done={doneSets}
                        total={all.length}
                        className={`${primaryClass} flex w-full items-center justify-center gap-2`}
                    />
                ) : done ? (
                    <p
                        role="status"
                        className={`${doneClass} flex w-full items-center justify-center gap-2`}
                    >
                        <CircleCheck
                            size={16}
                            aria-hidden
                        />
                        {t('today.done')}
                    </p>
                ) : (
                    <button
                        type="button"
                        disabled={pending}
                        onClick={started ? onFinish : onStart}
                        className={`${primaryClass} flex w-full items-center justify-center gap-2`}
                    >
                        {started ? (
                            <Flag
                                size={16}
                                aria-hidden
                            />
                        ) : (
                            <Play
                                size={16}
                                aria-hidden
                            />
                        )}
                        {started ? (
                            t('today.finish')
                        ) : (
                            <>
                                <span className="sm:hidden">
                                    {t(
                                        incomplete
                                            ? 'today.continueShort'
                                            : 'today.startShort'
                                    )}
                                </span>
                                <span className="hidden sm:inline">
                                    {t(
                                        incomplete
                                            ? 'today.continue'
                                            : 'today.start'
                                    )}
                                </span>
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
