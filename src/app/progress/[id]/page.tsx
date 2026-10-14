import { BackButton } from '@/components/ui/back-button';
import { RoutineHistory } from '@/components/history/routine-history';
import { RoutineSummary } from '@/components/history/routine-summary';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { currentWeek, sectionOf, toKind, workoutRuns } from '@/lib/progress';
import { isMember, routineHistory } from '@/lib/queries';
import { routineStats } from '@/lib/stats';
import { badgeClass } from '@/lib/ui';
import { FileSpreadsheet } from 'lucide-react';
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

    const { routine, byDay, timings } = history;
    const day = Number(query.currentDay);
    const initialDay = Number.isInteger(day) && day > 0 ? day : 0;

    const days = routine.workouts.map((workout) => ({
        id: workout.id,
        name: workout.name,
        exercises: workout.exercises,
        weeks: byDay[workout.id] ?? {},
    }));
    const week = currentWeek(routine.cursor, days.length);
    // A workout is read by the times it was done, not by weeks, and it does
    // not export.
    const workout = toKind(routine.kind) === 'workout';

    return (
        <div className="space-y-6">
            <header>
                <BackButton
                    fallback={`${sectionOf(routine.kind)}/${routine.id}`}
                />
                <h1 className="mt-5">
                    <span className="eyebrow text-muted block">
                        {routine.name}
                    </span>
                    <span className="display mt-1 block text-6xl">
                        {t('progress.title')}
                    </span>
                </h1>
                {!workout && (
                    <div className="mt-4 flex">
                        <a
                            href={`/progress/${routine.id}/export`}
                            download
                            className={`${badgeClass} lift border-line text-muted hover:border-pulse hover:text-pulse border-2`}
                        >
                            <FileSpreadsheet
                                size={13}
                                aria-hidden
                            />
                            {t('routine.export')}
                        </a>
                    </div>
                )}
            </header>

            {routine.workouts.length === 0 ? (
                <p className="border-line text-muted rounded-md border-2 border-dashed p-6 text-center text-sm">
                    {t('routine.noWorkouts')}
                </p>
            ) : (
                <>
                    <RoutineSummary
                        stats={routineStats(days, timings, routine.cursor)}
                        week={
                            workout
                                ? routine.cursor
                                : routine.durationWeeks
                                  ? Math.min(week, routine.durationWeeks)
                                  : week
                        }
                        weeks={routine.durationWeeks}
                        period={workout ? 'run' : 'week'}
                    />
                    <RoutineHistory
                        days={days}
                        durationWeeks={routine.durationWeeks}
                        cursor={routine.cursor}
                        initialDay={initialDay}
                        weeks={
                            workout
                                ? workoutRuns(routine.cursor, routine.isActive)
                                : undefined
                        }
                        period={workout ? 'run' : 'week'}
                    />
                </>
            )}
        </div>
    );
}
