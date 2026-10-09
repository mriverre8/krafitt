import { SharedOwnerBlocks } from '@/components/routine/routine-lists';
import { BackButton } from '@/components/ui/back-button';
import { Pagination } from '@/components/ui/pagination';
import { SearchBar } from '@/components/ui/search-bar';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { paginate, searchTerm } from '@/lib/pagination';
import {
    SHARED_SEARCH_FIELDS,
    countSharingOwners,
    sharingOwners,
} from '@/lib/queries';
import { redirect } from 'next/navigation';

export default async function AllSharedRoutinesPage({
    searchParams,
}: PageProps<'/routines/shared/all'>) {
    const user = await currentUser();
    if (!user) redirect('/');

    const params = await searchParams;
    const q = searchTerm(params.q);
    const by = SHARED_SEARCH_FIELDS.find((f) => f === params.by);
    const [total, t] = await Promise.all([
        countSharingOwners(user.id, q, by),
        getT(),
    ]);
    const { page, totalPages, skip, take } = paginate(params.page, total);
    const owners = await sharingOwners(user.id, { skip, take }, q, by);

    return (
        <div className="space-y-6">
            <header>
                <BackButton fallback="/routines/shared" />
                <h1 className="display text-6xl">
                    {t('routines.sharedTitle')}
                </h1>
            </header>

            <SearchBar
                label={t('routines.sharedSearchLabel')}
                placeholder={t('routines.sharedSearchPlaceholder')}
                defaultValue={q}
                filter={{
                    name: 'by',
                    label: t('routines.searchBy'),
                    value: by,
                    options: [
                        { value: '', label: t('routines.searchByAll') },
                        ...SHARED_SEARCH_FIELDS.map((f) => ({
                            value: f,
                            label: t(`routines.searchBy.${f}`),
                            placeholder: t(`routines.searchHint.${f}`),
                        })),
                    ],
                }}
            />

            <SharedOwnerBlocks
                owners={owners}
                searching={Boolean(q)}
            />

            <Pagination
                page={page}
                totalPages={totalPages}
            />
        </div>
    );
}
