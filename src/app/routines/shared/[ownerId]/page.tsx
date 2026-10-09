import { SharedRoutineList } from '@/components/routine/routine-lists';
import { Avatar } from '@/components/ui/avatar';
import { BackButton } from '@/components/ui/back-button';
import { Pagination } from '@/components/ui/pagination';
import { SearchBar } from '@/components/ui/search-bar';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { paginate, searchTerm } from '@/lib/pagination';
import {
    countSharedRoutines,
    sharedRoutinesOf,
    userHeader,
} from '@/lib/queries';
import { notFound, redirect } from 'next/navigation';

export default async function OwnerSharedRoutinesPage({
    params,
    searchParams,
}: PageProps<'/routines/shared/[ownerId]'>) {
    const user = await currentUser();
    if (!user) redirect('/');

    const [{ ownerId }, query] = await Promise.all([params, searchParams]);
    const q = searchTerm(query.q);

    const [shared, total, owner, t] = await Promise.all([
        countSharedRoutines(user.id, ownerId),
        q ? countSharedRoutines(user.id, ownerId, q) : null,
        userHeader(ownerId),
        getT(),
    ]);

    if (shared === 0 || !owner) notFound();

    const { page, totalPages, skip, take } = paginate(
        query.page,
        total ?? shared
    );
    const routines = await sharedRoutinesOf(
        user.id,
        ownerId,
        { skip, take },
        q
    );

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

            <SearchBar
                label={t('routines.searchLabel')}
                placeholder={t('routines.searchPlaceholder')}
                defaultValue={q}
            />

            <SharedRoutineList
                routines={routines}
                searching={Boolean(q)}
            />

            <Pagination
                page={page}
                totalPages={totalPages}
            />
        </div>
    );
}
