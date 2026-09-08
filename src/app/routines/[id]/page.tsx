import {
    addWorkout,
    deleteRoutine,
    deleteWorkout,
    saveExercises,
} from '@/app/actions';
import { ActionButton } from '@/components/action-button';
import { AddWorkoutForm } from '@/components/add-workout-form';
import { WorkoutEditor } from '@/components/workout-editor';
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

    // Recomputed with the page, so it is already up to date after every save.
    // Each day carries its own list; only the verdict is routine-wide.
    const complete = isRoutineComplete(routine, t);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="display text-6xl">{routine.name}</h1>
                <p className="eyebrow text-muted mt-2">
                    {t('routine.meta', {
                        weeks: routine.durationWeeks,
                        days: routine.workouts.length,
                    })}
                </p>
            </header>

            {/* Already active: the volt flame, the same badge the routine wears
                in the list, rather than an invitation to activate it. */}
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

            <section className="space-y-4">
                <h2 className="eyebrow text-muted">{t('routine.workouts')}</h2>

                {routine.workouts.map((workout) => (
                    <WorkoutEditor
                        key={workout.id}
                        workout={workout}
                        problems={workoutProblems(workout, t)}
                        faults={workoutFaults(workout.exercises)}
                        saveExercises={saveExercises}
                        onDeleteWorkout={deleteWorkout}
                    />
                ))}

                <AddWorkoutForm
                    action={addWorkout}
                    routineId={routine.id}
                />
            </section>

            <ActionButton
                action={deleteRoutine.bind(null, routine.id)}
                confirm={t('routine.deleteConfirm', { name: routine.name })}
                className="text-danger hover:text-danger/70 font-display flex items-center gap-1.5 text-sm font-bold tracking-wide uppercase transition-colors"
            >
                <Trash
                    size={14}
                    aria-hidden
                />
                {t('routine.delete')}
            </ActionButton>
        </div>
    );
}
