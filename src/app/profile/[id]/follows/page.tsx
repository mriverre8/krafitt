import { BackButton } from '@/components/ui/back-button';
import { Avatar } from '@/components/ui/avatar';
import { Pagination } from '@/components/ui/pagination';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { paginate } from '@/lib/pagination';
import { followList, profileUser, type FollowTab } from '@/lib/queries';
import { cardLinkClass } from '@/lib/ui';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

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

    const { page, totalPages, skip, take } = paginate(
        query.page,
        user._count[tab]
    );
    const people = await followList(id, tab, { skip, take });

    return (
        <div className="space-y-6">
            <header>
                <BackButton
                    fallback={`/profile/${id}`}
                    skipHistory
                />
                <h1 className="display text-5xl">{user.name}</h1>
            </header>

            <nav className="border-line flex gap-6 border-b-2">
                {(['followers', 'following'] as const).map((name) => {
                    const selected = name === tab;
                    return (
                        <Link
                            key={name}
                            href={`/profile/${id}/follows?tab=${name}`}
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

            {people.length > 0 ? (
                <>
                    <ul className="space-y-3">
                        {people.map((person) => (
                            <li key={person.id}>
                                <Link
                                    href={`/profile/${person.id}`}
                                    className={`${cardLinkClass} flex items-center gap-3`}
                                >
                                    <Avatar
                                        name={person.name}
                                        src={person.image}
                                        className="size-10 text-base"
                                    />
                                    <span className="display truncate text-2xl">
                                        {person.name}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                    />
                </>
            ) : (
                <p className="border-line text-muted rounded-md border-2 border-dashed p-6 text-center text-sm">
                    {t(
                        tab === 'followers'
                            ? 'follows.noFollowers'
                            : 'follows.noFollowing'
                    )}
                </p>
            )}
        </div>
    );
}
