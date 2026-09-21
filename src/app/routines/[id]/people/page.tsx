import { MemberRows } from '@/components/routine/member-rows';
import { MemberSearch } from '@/components/routine/member-search';
import { BackButton } from '@/components/ui/back-button';
import { FollowRowsSkeleton, Skeleton } from '@/components/ui/skeleton';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { routineHeader } from '@/lib/queries';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function RoutinePeoplePage({
    params,
}: PageProps<'/routines/[id]/people'>) {
    const { id } = await params;
    const user = await currentUser();
    if (!user) redirect('/');

    const [routine, t] = await Promise.all([routineHeader(id), getT()]);
    if (!routine) notFound();

    if (routine.creatorId !== user.id) notFound();

    return (
        <div className="space-y-6">
            <header>
                <BackButton fallback={`/routines/${id}`} />
                <h1 className="mt-5">
                    <span className="eyebrow text-muted block">
                        {routine.name}
                    </span>
                    <span className="display mt-1 block text-6xl">
                        {t('members.title')}
                    </span>
                </h1>
                <p className="text-muted mt-2 text-sm">
                    {t('members.subtitle')}
                </p>
            </header>

            <Suspense
                fallback={
                    <Skeleton>
                        <FollowRowsSkeleton />
                    </Skeleton>
                }
            >
                <MemberRows routineId={id} />
            </Suspense>

            <MemberSearch routineId={id} />
        </div>
    );
}
