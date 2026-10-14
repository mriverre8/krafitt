import { createWorkout } from '@/app/actions';
import { CreateWorkoutForm } from '@/components/routine/create-workout-form';
import { WorkoutList } from '@/components/routine/routine-lists';
import { RequestsTab } from '@/components/routine/routine-tabs';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { PREVIEW_SIZE } from '@/lib/pagination';
import { countRequests, countRoutines, routinesOf } from '@/lib/queries';
import { ghostClass } from '@/lib/ui';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function WorkoutsPage() {
    const user = await currentUser();
    if (!user) redirect('/');

    const [total, workouts, requests, t] = await Promise.all([
        countRoutines(user.id, 'workout'),
        routinesOf(user.id, { kind: 'workout', skip: 0, take: PREVIEW_SIZE }),
        countRequests(user.id, 'workout'),
        getT(),
    ]);

    return (
        <div className="space-y-6">
            <h1 className="display text-5xl sm:text-6xl">
                {t('nav.workouts')}
            </h1>
            {requests > 0 && (
                <nav className="border-line flex border-b-2">
                    <RequestsTab
                        count={requests}
                        section="/workouts"
                        t={t}
                    />
                </nav>
            )}

            <WorkoutList workouts={workouts} />
            {total > PREVIEW_SIZE && (
                <Link
                    href="/workouts/all"
                    className={`${ghostClass} block text-center`}
                >
                    {t('routines.viewMore')}
                </Link>
            )}

            <CreateWorkoutForm action={createWorkout} />
        </div>
    );
}
