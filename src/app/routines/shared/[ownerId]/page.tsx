import { SharedRoutineList } from '@/components/routine/routine-lists';
import { Avatar } from '@/components/ui/avatar';
import { BackButton } from '@/components/ui/back-button';
import { Pagination } from '@/components/ui/pagination';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { paginate } from '@/lib/pagination';
import { countSharedRoutines, sharedRoutinesOf } from '@/lib/queries';
import { notFound, redirect } from 'next/navigation';

export default async function OwnerSharedRoutinesPage({
    params,
    searchParams,
}: PageProps<'/routines/shared/[ownerId]'>) {
    const user = await currentUser();
    if (!user) redirect('/');

    const { ownerId } = await params;
    const [{ page: asked }, total, t] = await Promise.all([
        searchParams,
        countSharedRoutines(user.id, ownerId),
        getT(),
    ]);

    if (total === 0) notFound();

    const { page, totalPages, skip, take } = paginate(asked, total);
    const routines = await sharedRoutinesOf(user.id, ownerId, { skip, take });
    const owner = routines[0].creator;

    return (
        <div className="space-y-6">
            <header>
                <BackButton fallback="/routines/shared" />
                <p className="eyebrow text-muted">
                    {t('routines.sharedTitle')}
                </p>
                <h1 className="mt-2 flex min-w-0 items-center gap-3">
                    <Avatar
                        name={owner.name}
                        src={owner.image}
                        className="size-12 text-base"
                    />
                    <span className="display truncate text-6xl">
                        {owner.name}
                    </span>
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
