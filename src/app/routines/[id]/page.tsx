import {
    addWorkout,
    deleteRoutine,
    deleteWorkout,
    saveExercises,
} from '@/app/actions';
import { ActionButton } from '@/components/action-button';
import { AddWorkoutForm } from '@/components/add-workout-form';
import { BackButton } from '@/components/back-button';
import {
    EditModeProvider,
    EditModeToggle,
    WhenEditing,
} from '@/components/edit-mode';
import { RoutineDays } from '@/components/routine-days';
import { getT } from '@/i18n/server';
import { requireRoutine } from '@/lib/access';
import { currentUser } from '@/lib/auth';
import { routineDetail } from '@/lib/queries';
import { badgeClass } from '@/lib/ui';
import {
    isRoutineComplete,
    workoutFaults,
    workoutProblems,
} from '@/lib/validate';
import { CircleCheck, Flame, Trash } from 'lucide-react';
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
                            <WhenEditing>
                                <ActionButton
                                    action={deleteRoutine.bind(
                                        null,
                                        routine.id
                                    )}
                                    confirm={t('routine.deleteConfirm', {
                                        name: routine.name,
                                    })}
                                    className="text-danger hover:text-danger/70 eyebrow flex shrink-0 items-center gap-1.5 transition-colors"
                                >
                                    <Trash
                                        size={14}
                                        aria-hidden
                                    />
                                    {t('routine.delete')}
                                </ActionButton>
                            </WhenEditing>
                            <EditModeToggle />
                        </div>
                    </div>
                </header>

                {routine.isActive ? (
                    <p className={`${badgeClass} bg-volt text-on-volt`}>
                        <Flame
                            size={13}
                            aria-hidden
                        />
                        {t('routines.active')}
                    </p>
                ) : (
                    complete && (
                        <p className="text-pulse flex items-center gap-2 text-sm font-semibold">
                            <CircleCheck
                                size={16}
                                aria-hidden
                            />
                            {t('validate.ok')}
                        </p>
                    )
                )}
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
