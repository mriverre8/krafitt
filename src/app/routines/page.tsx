import { createRoutine } from '@/app/actions';
import { CreateRoutineForm } from '@/components/routine/create-routine-form';
import { RoutineCard } from '@/components/routine/routine-card';
import { Pagination } from '@/components/ui/pagination';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { paginate } from '@/lib/pagination';
import { isRoutineFinished, routineRank } from '@/lib/progress';
import { routinesOf } from '@/lib/queries';
import { isRoutineComplete } from '@/lib/validate';
import { redirect } from 'next/navigation';

export default async function RoutinesPage({
    searchParams,
}: PageProps<'/routines'>) {
    const user = await currentUser();
    if (!user) redirect('/');

    const [{ page: asked }, all, t] = await Promise.all([
        searchParams,
        routinesOf(user.id),
        getT(),
    ]);

    // Sorted whole, then paged: the status a card is ordered by is worked out
    // from its plan, which the database cannot sort on, so a page cut at the
    // database would only ever be sorted within itself.
    const sorted = all
        .map((routine) => ({
            routine,
            finished: isRoutineFinished(
                routine.cursor,
                routine._count.workouts,
                routine.durationWeeks
            ),
            canActivate: isRoutineComplete(routine, t),
        }))
        .sort(
            (a, b) =>
                routineRank({ ...a.routine, ...a }) -
                routineRank({ ...b.routine, ...b })
        );

    const { page, totalPages, skip, take } = paginate(asked, sorted.length);
    const routines = sorted.slice(skip, skip + take);

    return (
        <div className="space-y-6">
            <h1 className="display text-6xl">{t('routines.title')}</h1>

            <ul className="space-y-3">
                {routines.map(({ routine, finished, canActivate }) => (
                    <li key={routine.id}>
                        <RoutineCard
                            id={routine.id}
                            name={routine.name}
                            durationWeeks={routine.durationWeeks}
                            workoutCount={routine._count.workouts}
                            cursor={routine.cursor}
                            isActive={routine.isActive}
                            finished={finished}
                            canActivate={canActivate}
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

            <CreateRoutineForm action={createRoutine} />
        </div>
    );
}
