import { createWorkout } from '@/app/actions';
import { CreateWorkoutForm } from '@/components/routine/create-workout-form';
import {
    WorkoutList,
    ownRoutineState,
} from '@/components/routine/routine-lists';
import { BackButton } from '@/components/ui/back-button';
import { Pagination } from '@/components/ui/pagination';
import { SearchBar } from '@/components/ui/search-bar';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { paginate, searchTerm } from '@/lib/pagination';
import { WORKOUT_STATUSES, routineStatus } from '@/lib/progress';
import { routinesOf } from '@/lib/queries';
import { redirect } from 'next/navigation';

export default async function AllWorkoutsPage({
    searchParams,
}: PageProps<'/workouts/all'>) {
    const user = await currentUser();
    if (!user) redirect('/');

    const [params, t] = await Promise.all([searchParams, getT()]);
    const q = searchTerm(params.q);
    const status = WORKOUT_STATUSES.find((s) => s === params.status);

    const found = await routinesOf(user.id, { q, kind: 'workout' });
    const statuses = found.map((w) => routineStatus(ownRoutineState(w, t)));
    const matching = status
        ? found.filter((_, i) => statuses[i] === status)
        : found;
    const { page, totalPages, skip, take } = paginate(
        params.page,
        matching.length
    );

    return (
        <div className="space-y-6">
            <header>
                <BackButton fallback="/workouts" />
                <h1 className="display text-6xl">{t('workouts.title')}</h1>
            </header>

            <SearchBar
                label={t('workouts.searchLabel')}
                placeholder={t('workouts.searchPlaceholder')}
                defaultValue={q}
                filter={{
                    name: 'status',
                    label: t('routines.statusFilter'),
                    value: status,
                    options: [
                        {
                            value: '',
                            label: t('workouts.statusAll'),
                            count: found.length,
                        },
                        ...WORKOUT_STATUSES.map((s) => ({
                            value: s,
                            label: t(`workouts.${s}`),
                            count: statuses.filter((x) => x === s).length,
                        })),
                    ],
                }}
            />

            <WorkoutList
                workouts={matching.slice(skip, skip + take)}
                searching={Boolean(q || status)}
            />

            <Pagination
                page={page}
                totalPages={totalPages}
            />

            <CreateWorkoutForm action={createWorkout} />
        </div>
    );
}
