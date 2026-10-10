import { BackButton } from '@/components/ui/back-button';
import { RoutineHistory } from '@/components/history/routine-history';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { isMember, routineHistory } from '@/lib/queries';
import { notFound, redirect } from 'next/navigation';

export default async function RoutineProgressPage({
    params,
    searchParams,
}: PageProps<'/progress/[id]'>) {
    const [{ id }, query] = await Promise.all([params, searchParams]);
    const user = await currentUser();
    if (!user) redirect('/');

    const [history, t] = await Promise.all([routineHistory(id), getT()]);
    if (!history) notFound();

    if (history.routine.creatorId !== user.id && !(await isMember(id, user.id)))
        notFound();

    const { routine, byDay } = history;
    const day = Number(query.currentDay);
    const initialDay = Number.isInteger(day) && day > 0 ? day : 0;

    return (
        <div className="space-y-6">
            <header>
                <BackButton fallback={`/routines/${routine.id}`} />
                <h1 className="mt-5">
                    <span className="eyebrow text-muted block">
                        {routine.name}
                    </span>
                    <span className="display mt-1 block text-6xl">
                        {t('progress.title')}
                    </span>
                </h1>
            </header>

            {routine.workouts.length === 0 ? (
                <p className="border-line text-muted rounded-md border-2 border-dashed p-6 text-center text-sm">
                    {t('routine.noWorkouts')}
                </p>
            ) : (
                <RoutineHistory
                    days={routine.workouts.map((workout) => ({
                        id: workout.id,
                        name: workout.name,
                        exercises: workout.exercises,
                        weeks: byDay[workout.id] ?? {},
                    }))}
                    durationWeeks={routine.durationWeeks}
                    cursor={routine.cursor}
                    initialDay={initialDay}
                />
            )}
        </div>
    );
}
