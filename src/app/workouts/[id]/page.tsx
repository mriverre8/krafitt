import {
    deleteRoutine,
    duplicateRoutine,
    findRecipient,
    renameRoutine,
    saveExercises,
    saveRoutine,
    sendRoutine,
    setRoutineVisibility,
    startWorkout,
} from '@/app/actions';
import {
    EditModeBackButton,
    EditModeProvider,
    EditModeToggle,
    WhenEditing,
    WhenNotEditing,
} from '@/components/routine/edit-mode';
import { RoutineOptions } from '@/components/routine/routine-options';
import { ShareRoutineButton } from '@/components/routine/share-routine-button';
import { ActionButton } from '@/components/ui/action-button';
import { Avatar } from '@/components/ui/avatar';
import { HistoryLink } from '@/components/ui/history-link';
import { StatusBadge } from '@/components/ui/status-badge';
import { FinishWorkoutButton } from '@/components/workout/finish-workout-button';
import { WorkoutEditor } from '@/components/workout/workout-editor';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { toLogs } from '@/lib/history';
import {
    filledSets,
    flatSets,
    isRoutineFinished,
    routineStatus,
    toKind,
} from '@/lib/progress';
import {
    activeRoutine,
    retiredExerciseNames,
    sessionLogs,
    routineDetail,
} from '@/lib/queries';
import { badgeClass, cardClass } from '@/lib/ui';
import {
    isRoutineComplete,
    workoutFaults,
    workoutProblems,
} from '@/lib/validate';
import { CircleCheck, Play } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

const actionClass = `${badgeClass} lift border-line text-muted hover:border-pulse hover:text-pulse border-2`;

/**
 * One workout: a routine of a single day, done as many times as one likes,
 * edited between one time and the next, never while it is being done.
 *
 * Its owner's to train, edit and share. Made public, anyone holding the
 * address may read it and keep a copy — the plan, never the owner's sessions.
 */
export default async function WorkoutPage({
    params,
}: PageProps<'/workouts/[id]'>) {
    const { id } = await params;
    const user = await currentUser();
    if (!user) redirect('/');

    const [workout, t] = await Promise.all([routineDetail(id), getT()]);
    if (!workout || toKind(workout.kind) !== 'workout') notFound();
    const owner = workout.creatorId === user.id;
    if (!owner && !workout.isPublic) notFound();

    // Made with its one day, and it can never lose it.
    const day = workout.workouts[0];
    if (!day) notFound();

    const complete = isRoutineComplete(workout, t);
    // Whether its owner is doing it now is theirs to know.
    const inProgress = owner && workout.isActive;
    const status = routineStatus({
        isActive: inProgress,
        finished: false,
        canActivate: complete,
    });

    const [retired, onHome, logged] = await Promise.all([
        owner && !inProgress ? retiredExerciseNames(workout.id) : undefined,
        owner && status === 'pending' ? activeRoutine(user.id) : null,
        // The time under way, for its finish button to word itself by.
        inProgress ? sessionLogs(user.id, day.id, workout.cursor + 1) : [],
    ]);
    // Starting takes the home screen from whatever is on it. A routine still
    // being trained loses its place, and is named before it does; a workout
    // under way is not pushed aside at all — the server says so instead.
    const displaced =
        onHome &&
        toKind(onHome.kind) === 'routine' &&
        !isRoutineFinished(
            onHome.cursor,
            onHome._count.workouts,
            onHome.durationWeeks
        )
            ? onHome
            : null;

    return (
        <EditModeProvider>
            <div className="space-y-6">
                <header>
                    <EditModeBackButton fallback="/workouts" />
                    <h1 className="display mt-5 text-6xl">{workout.name}</h1>
                    <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="eyebrow text-muted min-w-0">
                            {owner
                                ? t('workouts.meta', {
                                      exercises: day.exercises.length,
                                      times: workout.cursor,
                                  })
                                : t('workouts.exercises', {
                                      exercises: day.exercises.length,
                                  })}
                        </p>
                        <div className="flex shrink-0 items-center gap-4">
                            <WhenNotEditing>
                                <RoutineOptions
                                    kind="workout"
                                    name={workout.name}
                                    rename={
                                        owner
                                            ? renameRoutine.bind(
                                                  null,
                                                  workout.id
                                              )
                                            : undefined
                                    }
                                    onDuplicate={
                                        owner
                                            ? duplicateRoutine.bind(
                                                  null,
                                                  workout.id
                                              )
                                            : undefined
                                    }
                                    onDelete={
                                        owner
                                            ? deleteRoutine.bind(
                                                  null,
                                                  workout.id
                                              )
                                            : undefined
                                    }
                                    onSave={
                                        owner
                                            ? undefined
                                            : saveRoutine.bind(null, workout.id)
                                    }
                                    editable={owner && !inProgress}
                                    isPublic={workout.isPublic}
                                    setVisibility={
                                        owner
                                            ? setRoutineVisibility.bind(
                                                  null,
                                                  workout.id
                                              )
                                            : undefined
                                    }
                                    send={
                                        owner && complete
                                            ? {
                                                  find: findRecipient.bind(
                                                      null,
                                                      workout.id
                                                  ),
                                                  send: sendRoutine.bind(
                                                      null,
                                                      workout.id
                                                  ),
                                              }
                                            : undefined
                                    }
                                />
                            </WhenNotEditing>
                            <WhenEditing>
                                <EditModeToggle />
                            </WhenEditing>
                        </div>
                    </div>
                </header>

                <div className="flex flex-wrap items-center gap-4">
                    {!owner ? (
                        <>
                            <Link
                                href={`/profile/${workout.creatorId}`}
                                className={`${actionClass} max-w-full`}
                            >
                                <Avatar
                                    name={workout.creator.name}
                                    src={workout.creator.image}
                                    className="size-[13.2px] text-[8px] md:size-[15.6px] md:text-[9px]"
                                />
                                {t('workout.by', {
                                    name: workout.creator.name,
                                })}
                            </Link>
                            {!complete && (
                                <StatusBadge
                                    status="incomplete"
                                    kind="workout"
                                />
                            )}
                        </>
                    ) : status === 'active' ? (
                        <>
                            <StatusBadge
                                status="active"
                                kind="workout"
                            />
                            <FinishWorkoutButton
                                routineId={workout.id}
                                done={filledSets(
                                    day.exercises,
                                    toLogs(logged, day.exercises)
                                )}
                                total={flatSets(day.exercises).length}
                                className={actionClass}
                            />
                        </>
                    ) : status === 'incomplete' ? (
                        <StatusBadge
                            status="incomplete"
                            kind="workout"
                        />
                    ) : (
                        <>
                            <WhenEditing>
                                <p className="text-pulse flex items-center gap-2 text-sm font-semibold">
                                    <CircleCheck
                                        size={16}
                                        aria-hidden
                                    />
                                    {t('workout.ready')}
                                </p>
                            </WhenEditing>
                            <WhenNotEditing>
                                <ActionButton
                                    action={startWorkout.bind(null, workout.id)}
                                    confirm={
                                        displaced
                                            ? {
                                                  title: t('workout.start'),
                                                  message: t(
                                                      'workout.startConfirm',
                                                      { name: displaced.name }
                                                  ),
                                                  confirmLabel:
                                                      t('workout.start'),
                                                  danger: false,
                                              }
                                            : undefined
                                    }
                                    className={actionClass}
                                >
                                    <Play
                                        size={13}
                                        aria-hidden
                                    />
                                    {t('workout.start')}
                                </ActionButton>
                            </WhenNotEditing>
                        </>
                    )}
                    {workout.isPublic && (
                        <WhenNotEditing>
                            <ShareRoutineButton name={workout.name} />
                        </WhenNotEditing>
                    )}
                    {owner &&
                        complete &&
                        (inProgress || workout.cursor > 0) && (
                            <WhenNotEditing>
                                <HistoryLink routineId={workout.id} />
                            </WhenNotEditing>
                        )}
                </div>

                <WorkoutEditor
                    workout={{
                        id: day.id,
                        name: day.name,
                        exercises: day.exercises,
                    }}
                    problems={
                        day.exercises.length > 0 ? workoutProblems(day, t) : []
                    }
                    faults={workoutFaults(day.exercises)}
                    retired={retired?.[day.id]}
                    saveExercises={saveExercises}
                    empty={
                        <div className={cardClass}>
                            <h2 className="display text-3xl">
                                {t('workout.emptyTitle')}
                            </h2>
                            <p className="text-muted mt-2 text-sm md:text-base">
                                {t('workout.emptyBody')}
                            </p>
                        </div>
                    }
                />
            </div>
        </EditModeProvider>
    );
}
