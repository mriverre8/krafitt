import { Avatar } from '@/components/ui/avatar';
import { TrainingYear } from '@/components/profile/training-year';
import { RoutineSummary } from '@/components/routine/routine-summary';
import { getLocale, getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { isRoutineFinished } from '@/lib/progress';
import { myRoutines, trainingDays } from '@/lib/queries';
import { cardClass, emptyClass, labelClass } from '@/lib/ui';
import { HOME } from '@/lib/routes';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
    const user = await currentUser();
    if (!user) redirect(HOME);

    const today = new Date();
    const [routines, days, t, locale] = await Promise.all([
        myRoutines(user.id),
        trainingDays(user.id, new Date(Date.UTC(today.getUTCFullYear(), 0, 1))),
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
    }));

    const active = summaries.find((r) => r.isActive && !r.finished);
    const finished = summaries.filter((r) => r.finished);
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
                    <p className={`${labelClass} mt-1.5`}>
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
                end={today.toISOString().slice(0, 10)}
            />

            <section className="space-y-3">
                <h2 className={labelClass}>{t('profile.activeTitle')}</h2>
                {active ? (
                    <RoutineSummary
                        {...active}
                        state="active"
                    />
                ) : (
                    <p className={emptyClass}>{t('home.noRoutineTitle')}</p>
                )}
            </section>

            <section className="space-y-3">
                <h2 className={labelClass}>{t('profile.finishedTitle')}</h2>
                {finished.length > 0 ? (
                    <ul className="space-y-3">
                        {finished.map((routine) => (
                            <li key={routine.id}>
                                <RoutineSummary
                                    {...routine}
                                    state="finished"
                                />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className={emptyClass}>{t('profile.noFinished')}</p>
                )}
            </section>
        </div>
    );
}
