import { createRoutine } from '@/app/actions';
import { CreateRoutineForm } from '@/components/routine/create-routine-form';
import { RoutineCard } from '@/components/routine/routine-card';
import { RoutineSharedCard } from '@/components/routine/routine-shared-card';
import { Pagination } from '@/components/ui/pagination';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { paginate } from '@/lib/pagination';
import { isRoutineFinished } from '@/lib/progress';
import { countRoutines, routinesOf, sharedRoutinesOf } from '@/lib/queries';
import { isRoutineComplete } from '@/lib/validate';
import { redirect } from 'next/navigation';

export default async function RoutinesPage({
    searchParams,
}: PageProps<'/routines'>) {
    const user = await currentUser();
    if (!user) redirect('/');

    const [{ page: asked }, total, shared, t] = await Promise.all([
        searchParams,
        countRoutines(user.id),
        sharedRoutinesOf(user.id),
        getT(),
    ]);
    const { page, totalPages, skip, take } = paginate(asked, total);
    const routines = await routinesOf(user.id, { skip, take });

    return (
        <div className="space-y-6">
            <h1 className="display text-6xl">{t('routines.title')}</h1>

            <ul className="space-y-3">
                {routines.map((routine) => (
                    <li key={routine.id}>
                        <RoutineCard
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
                        />
                    </li>
                ))}
                {routines.length === 0 && (
                    <li className="border-line text-muted rounded-md border-2 border-dashed p-6 text-center">
                        {t('routines.empty')}
                    </li>
                )}
            </ul>

            <Pagination
                page={page}
                totalPages={totalPages}
            />

            {shared.length > 0 && (
                <section className="space-y-3">
                    <h2 className="eyebrow text-muted">
                        {t('routines.sharedTitle')}
                    </h2>
                    <ul className="space-y-3">
                        {shared.map((routine) => (
                            <li key={routine.id}>
                                <RoutineSharedCard
                                    id={routine.id}
                                    name={routine.name}
                                    durationWeeks={routine.durationWeeks}
                                    workoutCount={routine._count.workouts}
                                    cursor={routine.cursor}
                                    ownerName={routine.creator.name}
                                    ownerImage={routine.creator.image}
                                    role={routine.role}
                                />
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <CreateRoutineForm action={createRoutine} />
        </div>
    );
}
