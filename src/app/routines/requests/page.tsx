import { RequestRows } from '@/components/routine/request-rows';
import { BackButton } from '@/components/ui/back-button';
import { Pagination } from '@/components/ui/pagination';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { paginate } from '@/lib/pagination';
import { countRequests, requestsOf } from '@/lib/queries';
import { redirect } from 'next/navigation';

export default async function RoutineRequestsPage({
    searchParams,
}: PageProps<'/routines/requests'>) {
    const user = await currentUser();
    if (!user) redirect('/');

    const [params, total, t] = await Promise.all([
        searchParams,
        countRequests(user.id),
        getT(),
    ]);
    const { page, totalPages, skip, take } = paginate(params.page, total);
    const requests = await requestsOf(user.id, { skip, take });

    return (
        <div className="space-y-6">
            <header>
                <BackButton
                    fallback="/routines"
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
