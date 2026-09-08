import { createRoutine, setActiveRoutine } from '@/app/actions';
import { CreateRoutineForm } from '@/components/create-routine-form';
import { RoutineCard } from '@/components/routine-card';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { isRoutineFinished } from '@/lib/progress';
import { myRoutines } from '@/lib/queries';
import { isRoutineComplete } from '@/lib/validate';
import { redirect } from 'next/navigation';

export default async function RoutinesPage() {
    const user = await currentUser();
    if (!user) redirect('/');

    const [routines, t] = await Promise.all([myRoutines(user.id), getT()]);

    return (
        <div className="space-y-6">
            <h1 className="display text-6xl">{t('routines.title')}</h1>

            <ul className="space-y-3">
                {routines.map((routine) => (
                    <RoutineCard
                        key={routine.id}
                        id={routine.id}
                        name={routine.name}
                        durationWeeks={routine.durationWeeks}
                        workoutCount={routine._count.workouts}
                        cursor={routine.cursor}
                        isActive={routine.isActive}
                        finished={isRoutineFinished(
                            routine.cursor,
                            routine._count.workouts,
                            routine.durationWeeks
                        )}
                        canActivate={isRoutineComplete(routine, t)}
                        onSetActive={setActiveRoutine}
                    />
                ))}
                {routines.length === 0 && (
                    <li className="border-line text-muted rounded-md border-2 border-dashed p-6 text-center">
                        {t('routines.empty')}
                    </li>
                )}
            </ul>

            <CreateRoutineForm action={createRoutine} />
        </div>
    );
}
