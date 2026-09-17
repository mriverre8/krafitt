import { Avatar } from '@/components/ui/avatar';
import { TrainingYear } from '@/components/profile/training-year';
import { RoutineCard } from '@/components/routine/routine-card';
import { Pagination } from '@/components/ui/pagination';
import { getLocale, getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { paginate } from '@/lib/pagination';
import { isRoutineFinished } from '@/lib/progress';
import { myRoutines, trainingDays } from '@/lib/queries';
import { dayKey, utc } from '@/lib/training-year';
import { cardClass } from '@/lib/ui';
import { isRoutineComplete } from '@/lib/validate';
import { redirect } from 'next/navigation';

const emptyClass =
    'border-line text-muted rounded-md border-2 border-dashed p-6 text-center text-sm';

export default async function ProfilePage({
    searchParams,
}: PageProps<'/profile'>) {
    const user = await currentUser();
    if (!user) redirect('/');

    const today = new Date();
    const end = dayKey(today);
    const yearStart = new Date(utc(today.getUTCFullYear(), 0, 1));
    const [{ finished: askedPage }, routines, days, t, locale] =
        await Promise.all([
            searchParams,
            myRoutines(user.id),
            trainingDays(user.id, yearStart),
            getT(),
            getLocale(),
        ]);

    const summaries = routines.map((routine) => ({
        id: routine.id,
        name: routine.name,
        durationWeeks: routine.durationWeeks,
        workoutCount: routine._count.workouts,
        cursor: routine.cursor,
        isActive: routine.isActive,
        finished: isRoutineFinished(
            routine.cursor,
            routine._count.workouts,
            routine.durationWeeks
        ),
        canActivate: isRoutineComplete(routine, t),
    }));

    const active = summaries.find((r) => r.isActive && !r.finished);

    const finished = summaries.filter((r) => r.finished);
    const { page, totalPages, skip, take } = paginate(
        askedPage,
        finished.length
    );
    const workoutsDone = summaries.reduce(
        (sum, r) => sum + Math.min(r.cursor, r.workoutCount * r.durationWeeks),
        0
    );

    const memberSince = new Intl.DateTimeFormat(locale, {
        month: 'long',
        year: 'numeric',
    }).format(user.createdAt);

    return (
        <div className="space-y-6">
            <header className={`${cardClass} flex items-center gap-4`}>
                <Avatar
                    name={user.name}
                    src={user.image}
                    className="size-16 text-2xl md:size-20 md:text-3xl"
                />
                <div className="min-w-0">
                    <h1 className="display truncate text-4xl md:text-5xl">
                        {user.name}
                    </h1>
                    <p className="eyebrow text-muted mt-1.5">
                        {t('profile.memberSince', { date: memberSince })}
                    </p>
                    <p className="figure text-muted mt-2 text-sm">
                        {t('profile.stats', {
                            routines: summaries.length,
                            workouts: workoutsDone,
                        })}
                    </p>
                </div>
            </header>

            <TrainingYear
                days={days}
                end={end}
            />

            <section className="space-y-3">
                <h2 className="eyebrow text-muted">
                    {t('profile.activeTitle')}
                </h2>
                {active ? (
                    <RoutineCard {...active} />
                ) : (
                    <p className={emptyClass}>{t('home.noRoutineTitle')}</p>
                )}
            </section>

            <section className="space-y-3">
                <h2 className="eyebrow text-muted">
                    {t('profile.finishedTitle')}
                </h2>
                {finished.length > 0 ? (
                    <>
                        <ul className="space-y-3">
                            {finished
                                .slice(skip, skip + take)
                                .map((routine) => (
                                    <li key={routine.id}>
                                        <RoutineCard {...routine} />
                                    </li>
                                ))}
                        </ul>
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            param="finished"
                        />
                    </>
                ) : (
                    <p className={emptyClass}>{t('profile.noFinished')}</p>
                )}
            </section>
        </div>
    );
}
