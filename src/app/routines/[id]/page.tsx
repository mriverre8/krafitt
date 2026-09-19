import {
    addWorkoutTo,
    deactivateRoutine,
    deleteRoutine,
    deleteWorkout,
    renameRoutine,
    renameWorkout,
    saveExercises,
    setActiveRoutine,
    setRoutineDuration,
    setRoutineVisibility,
} from '@/app/actions';
import { ActionButton } from '@/components/ui/action-button';
import {
    EditModeBackButton,
    EditModeProvider,
    EditModeToggle,
    WhenEditing,
    WhenNotEditing,
} from '@/components/routine/edit-mode';
import { EmptyRoutine } from '@/components/routine/empty-routine';
import { HistoryLink } from '@/components/ui/history-link';
import { RoutineDays } from '@/components/routine/routine-days';
import { RoutineOptions } from '@/components/routine/routine-options';
import { ShareRoutineButton } from '@/components/routine/share-routine-button';
import { Avatar } from '@/components/ui/avatar';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { WEEKS } from '@/lib/constants';
import {
    currentWeek,
    isRoutineFinished,
    isRoutineLocked,
} from '@/lib/progress';
import { routineDetail } from '@/lib/queries';
import { badgeClass } from '@/lib/ui';
import {
    isRoutineComplete,
    workoutFaults,
    workoutProblems,
} from '@/lib/validate';
import { CircleCheck, Flame } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

export default async function RoutinePage({
    params,
}: PageProps<'/routines/[id]'>) {
    const { id } = await params;
    const user = await currentUser();
    if (!user) redirect('/');

    const [routine, t] = await Promise.all([routineDetail(id), getT()]);
    if (!routine) notFound();

    const owner = routine.creatorId === user.id;
    if (!owner && !routine.isPublic) notFound();

    const complete = isRoutineComplete(routine, t);
    const finished = isRoutineFinished(
        routine.cursor,
        routine.workouts.length,
        routine.durationWeeks
    );
    const locked = isRoutineLocked({
        ...routine,
        sessionCount: routine._count.sessions,
    });

    const addDay =
        locked || !owner ? undefined : addWorkoutTo.bind(null, routine.id);

    // A block can be cut short or run on while it is being trained, down to the
    // week after the one in progress and up to the same ceiling the form offers.
    // Nothing to offer once it is over, or when there was never an end to move.
    const durationFloor =
        currentWeek(routine.cursor, routine.workouts.length) + 1;
    const duration =
        routine.durationWeeks !== null &&
        !finished &&
        durationFloor <= WEEKS.max
            ? {
                  weeks: routine.durationWeeks,
                  min: durationFloor,
                  save: setRoutineDuration.bind(null, routine.id),
              }
            : undefined;

    return (
        <EditModeProvider>
            <div className="space-y-6">
                <header>
                    <EditModeBackButton fallback="/routines" />
                    <h1 className="display mt-5 text-6xl">{routine.name}</h1>
                    <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="eyebrow text-muted min-w-0">
                            {routine.durationWeeks === null
                                ? t('routine.metaOpen', {
                                      days: routine.workouts.length,
                                  })
                                : t('routine.meta', {
                                      weeks: routine.durationWeeks,
                                      days: routine.workouts.length,
                                  })}
                        </p>
                        {owner && (
                            <div className="flex shrink-0 items-center gap-4">
                                <WhenNotEditing>
                                    <RoutineOptions
                                        name={routine.name}
                                        rename={
                                            finished
                                                ? undefined
                                                : renameRoutine.bind(
                                                      null,
                                                      routine.id
                                                  )
                                        }
                                        onDelete={deleteRoutine.bind(
                                            null,
                                            routine.id
                                        )}
                                        duration={duration}
                                        editable={!locked}
                                        isPublic={routine.isPublic}
                                        setVisibility={setRoutineVisibility.bind(
                                            null,
                                            routine.id
                                        )}
                                    />
                                </WhenNotEditing>
                                <WhenEditing>
                                    <EditModeToggle />
                                </WhenEditing>
                            </div>
                        )}
                    </div>
                </header>

                <div className="flex flex-wrap items-center gap-4">
                    {!owner ? (
                        <>
                            <Link
                                href={`/profile/${routine.creatorId}`}
                                className={`${badgeClass} lift border-line text-muted hover:border-pulse hover:text-pulse max-w-full border-2`}
                            >
                                <Avatar
                                    name={routine.creator.name}
                                    src={routine.creator.image}
                                    className="size-[13.2px] text-[8px] md:size-[15.6px] md:text-[9px]"
                                />
                                {t('routine.by', {
                                    name: routine.creator.name,
                                })}
                            </Link>
                            {!complete && (
                                <p
                                    className={`${badgeClass} border-line text-muted border-2 border-dashed`}
                                >
                                    {t('routines.incomplete')}
                                </p>
                            )}
                        </>
                    ) : finished ? (
                        <p
                            className={`${badgeClass} border-surge text-surge border-2`}
                        >
                            <CircleCheck
                                size={13}
                                aria-hidden
                            />
                            {t('routines.finished')}
                        </p>
                    ) : routine.isActive ? (
                        <>
                            <p className={`${badgeClass} bg-volt text-on-volt`}>
                                <Flame
                                    size={13}
                                    aria-hidden
                                />
                                {t('routines.active')}
                            </p>
                            <WhenNotEditing>
                                <ActionButton
                                    action={deactivateRoutine.bind(
                                        null,
                                        routine.id
                                    )}
                                    className={`${badgeClass} lift border-line text-muted hover:border-pulse hover:text-pulse border-2`}
                                >
                                    {t('routine.deactivate')}
                                </ActionButton>
                            </WhenNotEditing>
                        </>
                    ) : !complete ? (
                        <p
                            className={`${badgeClass} border-line text-muted border-2 border-dashed`}
                        >
                            {t('routines.incomplete')}
                        </p>
                    ) : (
                        <>
                            {!locked && (
                                <p className="text-pulse flex items-center gap-2 text-sm font-semibold">
                                    <CircleCheck
                                        size={16}
                                        aria-hidden
                                    />
                                    {t('validate.ok')}
                                </p>
                            )}
                            <WhenNotEditing>
                                <ActionButton
                                    action={setActiveRoutine.bind(
                                        null,
                                        routine.id
                                    )}
                                    className={`${badgeClass} lift border-line text-muted hover:border-pulse hover:text-pulse border-2`}
                                >
                                    {t('routines.markActive')}
                                </ActionButton>
                            </WhenNotEditing>
                        </>
                    )}
                    {owner && routine.isPublic && (
                        <WhenNotEditing>
                            <ShareRoutineButton name={routine.name} />
                        </WhenNotEditing>
                    )}
                    {owner && locked && <HistoryLink routineId={routine.id} />}
                </div>
                {routine.workouts.length === 0 && (
                    <EmptyRoutine addDay={addDay} />
                )}

                <RoutineDays
                    addDay={addDay}
                    days={routine.workouts.map((workout) => ({
                        id: workout.id,
                        name: workout.name,
                        exercises: workout.exercises,
                        problems: workoutProblems(workout, t),
                        faults: workoutFaults(workout.exercises),
                    }))}
                    saveExercises={saveExercises}
                    renameWorkout={renameWorkout}
                    onDeleteWorkout={deleteWorkout}
                />
            </div>
        </EditModeProvider>
    );
}
