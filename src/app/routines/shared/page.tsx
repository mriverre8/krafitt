import { SharedRoutineList } from '@/components/routine/routine-lists';
import { BackButton } from '@/components/ui/back-button';
import { Pagination } from '@/components/ui/pagination';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { paginate } from '@/lib/pagination';
import { countSharedRoutines, sharedRoutinesOf } from '@/lib/queries';
import { redirect } from 'next/navigation';

export default async function SharedRoutinesPage({
    searchParams,
}: PageProps<'/routines/shared'>) {
    const user = await currentUser();
    if (!user) redirect('/');

    const [{ page: asked }, total, t] = await Promise.all([
        searchParams,
        countSharedRoutines(user.id),
        getT(),
    ]);
    const { page, totalPages, skip, take } = paginate(asked, total);
    const routines = await sharedRoutinesOf(user.id, { skip, take });

    return (
        <div className="space-y-6">
            <header>
                <BackButton fallback="/routines" />
                <h1 className="display text-6xl">
                    {t('routines.sharedTitle')}
                </h1>
            </header>

            <SharedRoutineList routines={routines} />

            <Pagination
                page={page}
                totalPages={totalPages}
            />
        </div>
    );
}
