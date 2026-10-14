import { RequestRows } from '@/components/routine/request-rows';
import { BackButton } from '@/components/ui/back-button';
import { Pagination } from '@/components/ui/pagination';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { paginate } from '@/lib/pagination';
import { countRequests, requestsOf } from '@/lib/queries';
import { redirect } from 'next/navigation';

/** The workouts sent to the user, waiting on an answer: the routines have an
    inbox of their own. */
export default async function WorkoutRequestsPage({
    searchParams,
}: PageProps<'/workouts/requests'>) {
    const user = await currentUser();
    if (!user) redirect('/');

    const [params, total, t] = await Promise.all([
        searchParams,
        countRequests(user.id, 'workout'),
        getT(),
    ]);
    const { page, totalPages, skip, take } = paginate(params.page, total);
    const requests = await requestsOf(user.id, { skip, take }, 'workout');

    return (
        <div className="space-y-6">
            <header>
                <BackButton
                    fallback="/workouts"
                    skipHistory
                />
                <h1 className="display text-6xl">{t('requests.title')}</h1>
            </header>

            <RequestRows requests={requests} />

            <Pagination
                page={page}
                totalPages={totalPages}
            />
        </div>
    );
}
