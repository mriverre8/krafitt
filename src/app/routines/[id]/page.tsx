import {
    addWorkout,
    deleteRoutine,
    deleteWorkout,
    saveExercises,
    setActiveRoutine,
} from '@/app/actions';
import { ActionButton } from '@/components/action-button';
import { AddWorkoutForm } from '@/components/add-workout-form';
import { BackButton } from '@/components/back-button';
import { DeleteRoutineButton } from '@/components/delete-routine-button';
import {
    EditModeProvider,
    EditModeToggle,
    WhenEditing,
    WhenNotEditing,
} from '@/components/edit-mode';
import { HistoryLink } from '@/components/history-link';
import { RoutineDays } from '@/components/routine-days';
import { getT } from '@/i18n/server';
import { requireRoutine } from '@/lib/access';
import { currentUser } from '@/lib/auth';
import { isRoutineFinished, isRoutineLocked } from '@/lib/progress';
import { routineDetail } from '@/lib/queries';
import { badgeClass } from '@/lib/ui';
import {
    isRoutineComplete,
    workoutFaults,
    workoutProblems,
} from '@/lib/validate';
import { CircleCheck, Flame } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';

export default async function RoutinePage({
    params,
}: PageProps<'/routines/[id]'>) {
    const { id } = await params;
    const user = await currentUser();
    if (!user) redirect('/');

    await requireRoutine(id, user.id);
    const [routine, t] = await Promise.all([routineDetail(id), getT()]);
    if (!routine) notFound();

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

    return (
        <EditModeProvider>
            <div className="space-y-6">
                <header>
                    <BackButton fallback="/routines" />
                    <h1 className="display mt-5 text-6xl">{routine.name}</h1>
                    <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="eyebrow text-muted min-w-0">
                            {t('routine.meta', {
                                weeks: routine.durationWeeks,
                                days: routine.workouts.length,
                            })}
                        </p>
                        <div className="flex shrink-0 items-center gap-4">
                            {locked ? (
                                <DeleteRoutineButton
                                    name={routine.name}
                                    onDelete={deleteRoutine.bind(
                                        null,
                                        routine.id
                                    )}
                                />
                            ) : (
                                <>
                                    <WhenEditing>
                                        <DeleteRoutineButton
                                            name={routine.name}
                                            onDelete={deleteRoutine.bind(
                                                null,
                                                routine.id
                                            )}
                                        />
                                    </WhenEditing>
                                    <EditModeToggle />
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex flex-wrap items-center gap-4">
                    {finished ? (
                        <p
                            className={`${badgeClass} border-line text-muted border-2`}
                        >
                            <CircleCheck
                                size={13}
                                aria-hidden
                            />
                            {t('routines.finished')}
                        </p>
                    ) : routine.isActive ? (
                        <p className={`${badgeClass} bg-volt text-on-volt`}>
                            <Flame
                                size={13}
                                aria-hidden
                            />
                            {t('routines.active')}
                        </p>
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
                    {locked && <HistoryLink routineId={routine.id} />}
                </div>
                {routine.workouts.length === 0 && (
                    <p className="text-danger text-sm">
                        {t('validate.noWorkouts')}
                    </p>
                )}

                <WhenEditing>
                    <AddWorkoutForm
                        action={addWorkout}
                        routineId={routine.id}
                    />
                </WhenEditing>

                <RoutineDays
                    days={routine.workouts.map((workout) => ({
                        id: workout.id,
                        name: workout.name,
                        exercises: workout.exercises,
                        problems: workoutProblems(workout, t),
                        faults: workoutFaults(workout.exercises),
                    }))}
                    saveExercises={saveExercises}
                    onDeleteWorkout={deleteWorkout}
                />
            </div>
        </EditModeProvider>
    );
}
