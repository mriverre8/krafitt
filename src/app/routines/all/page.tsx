import { createRoutine } from '@/app/actions';
import { CreateRoutineForm } from '@/components/routine/create-routine-form';
import {
    RoutineList,
    ownRoutineState,
} from '@/components/routine/routine-lists';
import { BackButton } from '@/components/ui/back-button';
import { Pagination } from '@/components/ui/pagination';
import { SearchBar } from '@/components/ui/search-bar';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { paginate, searchTerm } from '@/lib/pagination';
import { ROUTINE_STATUSES, routineStatus } from '@/lib/progress';
import { routinesOf } from '@/lib/queries';
import { redirect } from 'next/navigation';

export default async function AllRoutinesPage({
    searchParams,
}: PageProps<'/routines/all'>) {
    const user = await currentUser();
    if (!user) redirect('/');

    const [params, t] = await Promise.all([searchParams, getT()]);
    const q = searchTerm(params.q);
    const status = ROUTINE_STATUSES.find((s) => s === params.status);

    const found = await routinesOf(user.id, { q });
    const statuses = found.map((r) => routineStatus(ownRoutineState(r, t)));
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
                <BackButton fallback="/routines" />
                <h1 className="display text-6xl">{t('routines.title')}</h1>
            </header>

            <SearchBar
                label={t('routines.searchLabel')}
                placeholder={t('routines.searchPlaceholder')}
                defaultValue={q}
                filter={{
                    name: 'status',
                    label: t('routines.statusFilter'),
                    value: status,
                    options: [
                        {
                            value: '',
                            label: t('routines.statusAll'),
                            count: found.length,
                        },
                        ...ROUTINE_STATUSES.map((s) => ({
                            value: s,
                            label: t(`routines.${s}`),
                            count: statuses.filter((x) => x === s).length,
                        })),
                    ],
                }}
            />

            <RoutineList
                routines={matching.slice(skip, skip + take)}
                searching={Boolean(q || status)}
            />

            <Pagination
                page={page}
                totalPages={totalPages}
            />

            <CreateRoutineForm action={createRoutine} />
        </div>
    );
}
