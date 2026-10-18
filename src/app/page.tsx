import { EmptyState } from '@/components/ui/empty-state';
import { Landing } from '@/components/landing/landing';
import { TodayWorkout } from '@/components/workout/today-workout';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { toKind } from '@/lib/progress';
import { todayWorkout } from '@/lib/queries';

export default async function HomePage() {
    const user = await currentUser();
    if (!user) return <Landing />;

    const [today, t] = await Promise.all([todayWorkout(user.id), getT()]);

    if (!today) {
        return (
            <EmptyState
                title={t('home.idleTitle')}
                body={t('home.idleBody')}
            />
        );
    }

    if (today.finished) {
        return (
            <EmptyState
                title={t('home.finishedTitle', { name: today.routine.name })}
                body={t('home.finishedBody')}
            />
        );
    }

    return (
        <TodayWorkout
            routineId={today.routine.id}
            routineName={today.routine.name}
            week={today.week}
            totalWeeks={today.routine.durationWeeks}
            workout={today.workout}
            day={today.day}
            choices={today.choices}
            started={today.started}
            logs={today.logs}
            previous={today.previous}
            kind={toKind(today.routine.kind)}
        />
    );
}
