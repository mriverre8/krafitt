import { SharedOwnerBlocks } from '@/components/routine/routine-lists';
import { BackButton } from '@/components/ui/back-button';
import { Pagination } from '@/components/ui/pagination';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { paginate } from '@/lib/pagination';
import { countSharingOwners, sharingOwners } from '@/lib/queries';
import { redirect } from 'next/navigation';

export default async function AllSharedRoutinesPage({
    searchParams,
}: PageProps<'/routines/shared/all'>) {
    const user = await currentUser();
    if (!user) redirect('/');

    const [{ page: asked }, total, t] = await Promise.all([
        searchParams,
        countSharingOwners(user.id),
        getT(),
    ]);
    const { page, totalPages, skip, take } = paginate(asked, total);
    const owners = await sharingOwners(user.id, { skip, take });

    return (
        <div className="space-y-6">
            <header>
                <BackButton fallback="/routines/shared" />
                <h1 className="display text-6xl">
                    {t('routines.sharedTitle')}
                </h1>
            </header>

            <SharedOwnerBlocks owners={owners} />

            <Pagination
                page={page}
                totalPages={totalPages}
            />
        </div>
    );
}
