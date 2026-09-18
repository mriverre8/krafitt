import { FollowRows } from '@/components/profile/follow-rows';
import { BackButton } from '@/components/ui/back-button';
import { FollowRowsSkeleton, Skeleton } from '@/components/ui/skeleton';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { profileUser, type FollowTab } from '@/lib/queries';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function FollowsPage({
    params,
    searchParams,
}: PageProps<'/profile/[id]/follows'>) {
    const viewer = await currentUser();
    if (!viewer) redirect('/');

    const [{ id }, query, t] = await Promise.all([
        params,
        searchParams,
        getT(),
    ]);

    const tab: FollowTab =
        query.tab === 'following' ? 'following' : 'followers';

    const user = await profileUser(id);
    if (!user) notFound();

    return (
        <div className="space-y-6">
            <header>
                <BackButton fallback={`/profile/${id}`} />
                <h1 className="display text-5xl">{user.name}</h1>
            </header>

            <nav className="border-line flex gap-6 border-b-2">
                {(['followers', 'following'] as const).map((name) => {
                    const selected = name === tab;
                    return (
                        <Link
                            key={name}
                            href={`/profile/${id}/follows?tab=${name}`}
                            replace
                            scroll={false}
                            aria-current={selected ? 'page' : undefined}
                            className={`font-display -mb-0.5 border-b-2 pb-2 text-sm font-bold tracking-wide uppercase transition-colors ${
                                selected
                                    ? 'border-volt text-ink'
                                    : 'text-muted hover:text-pulse border-transparent'
                            }`}
                        >
                            {t(`profile.${name}`, { count: user._count[name] })}
                        </Link>
                    );
                })}
            </nav>
            <Suspense
                key={tab}
                fallback={
                    <Skeleton>
                        <FollowRowsSkeleton />
                    </Skeleton>
                }
            >
                <FollowRows
                    id={id}
                    tab={tab}
                    viewerId={viewer.id}
                    asked={query.shown}
                    total={user._count[tab]}
                />
            </Suspense>
        </div>
    );
}
