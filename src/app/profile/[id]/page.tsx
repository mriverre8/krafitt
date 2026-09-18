import { Avatar } from '@/components/ui/avatar';
import { TrainingYear } from '@/components/profile/training-year';
import { RoutineCard } from '@/components/routine/routine-card';
import { Pagination } from '@/components/ui/pagination';
import { getLocale, getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { paginate } from '@/lib/pagination';
import { isRoutineFinished, profileRoutines } from '@/lib/progress';
import { profileUser, routinesOf, trainingDays } from '@/lib/queries';
import { dayKey, utc } from '@/lib/training-year';
import { cardClass } from '@/lib/ui';
import { isRoutineComplete } from '@/lib/validate';
import { notFound, redirect } from 'next/navigation';

const emptyClass =
    'border-line text-muted rounded-md border-2 border-dashed p-6 text-center text-sm';

export default async function ProfilePage({
    params,
    searchParams,
}: PageProps<'/profile/[id]'>) {
    const viewer = await currentUser();
    if (!viewer) redirect('/');

    const today = new Date();
    const end = dayKey(today);
    const yearStart = new Date(utc(today.getUTCFullYear(), 0, 1));
    const [{ id }, { page: askedPage }, t, locale] = await Promise.all([
        params,
        searchParams,
        getT(),
        getLocale(),
    ]);
    const [user, routines, days] = await Promise.all([
        profileUser(id),
        routinesOf(id),
        trainingDays(id, yearStart),
    ]);
    if (!user) notFound();

    const me = id === viewer.id;

    const summaries = routines.map((routine) => ({
        id: routine.id,
        name: routine.name,
        durationWeeks: routine.durationWeeks,
        workoutCount: routine._count.workouts,
        cursor: routine.cursor,
        isActive: routine.isActive,
        isPublic: routine.isPublic,
        finished: isRoutineFinished(
            routine.cursor,
            routine._count.workouts,
            routine.durationWeeks
        ),
        canActivate: isRoutineComplete(routine, t),
    }));

    const { active, published } = profileRoutines(summaries, me);
    const { page, totalPages, skip, take } = paginate(
        askedPage,
        published.length
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

            {(me || active) && (
                <section className="space-y-3">
                    <h2 className="eyebrow text-muted">
                        {t('profile.activeTitle')}
                    </h2>
                    {active ? (
                        <RoutineCard {...active} />
                    ) : (
                        <p className={emptyClass}>{t('profile.noActive')}</p>
                    )}
                </section>
            )}

            <section className="space-y-3">
                <h2 className="eyebrow text-muted">
                    {t('profile.publicTitle')}
                </h2>
                {published.length > 0 ? (
                    <>
                        <ul className="space-y-3">
                            {published
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
                        />
                    </>
                ) : (
                    <p className={emptyClass}>{t('profile.noPublic')}</p>
                )}
            </section>
        </div>
    );
}
