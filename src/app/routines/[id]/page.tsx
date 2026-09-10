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

    // Recomputed with the page, so it is already up to date after every save.
    // Each day carries its own list; only the verdict is routine-wide.
    const complete = isRoutineComplete(routine, t);

    return (
        // The routine opens as something to read. Edit is what brings out the
        // controls below — and everything it brings out is wrapped here or
        // reads the same context further down.
        <EditModeProvider>
            <div className="space-y-6">
                <header>
                    <BackButton fallback="/routines" />
                    <h1 className="display mt-5 text-6xl">{routine.name}</h1>
                    {/* Editing and deleting the routine ride the subtitle line,
                        at the far end: both belong to the routine as a whole,
                        so they sit with the line that describes the routine as
                        a whole rather than below whichever day is open. Set in
                        the same eyebrow as the text they share the line with,
                        and delete danger-coloured because nothing else here
                        destroys anything. */}
                    <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="eyebrow text-muted min-w-0">
                            {t('routine.meta', {
                                weeks: routine.durationWeeks,
                                days: routine.workouts.length,
                            })}
                        </p>
                        {/* Edit/Done sits at the far end, so it keeps the same
                            spot whether or not delete is out beside it. */}
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

                {/* Already active: the volt flame, the same badge the routine
                    wears in the list, rather than an invitation to activate
                    it. */}
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

                {/* Above the rack it feeds: adding a day is a routine-level
                    move, like naming the routine or deleting it, not something
                    you do from inside whichever day happens to be on screen. */}
                <WhenEditing>
                    <AddWorkoutForm
                        action={addWorkout}
                        routineId={routine.id}
                    />
                </WhenEditing>

                {/* One day at a time. Everything the switcher needs to mark a
                    day as trainable is worked out here, next to the routine-wide
                    verdict above, so both answer to the same rules. */}
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
