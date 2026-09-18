import { BackButton } from '@/components/ui/back-button';
import { FollowButton } from '@/components/profile/follow-button';
import { Avatar } from '@/components/ui/avatar';
import { getT } from '@/i18n/server';
import { currentUser } from '@/lib/auth';
import { loadMore } from '@/lib/pagination';
import {
    followList,
    followingAmong,
    profileUser,
    type FollowTab,
} from '@/lib/queries';
import { cardClass, ghostClass } from '@/lib/ui';
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

    const { shown, next } = loadMore(query.shown, user._count[tab]);
    const people = await followList(id, tab, { skip: 0, take: shown });
    const followed = await followingAmong(
        viewer.id,
        people.map((person) => person.id)
    );

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

            {people.length > 0 ? (
                <>
                    <ul className="space-y-3">
                        {people.map((person) => (
                            <li
                                key={person.id}
                                className={`${cardClass} flex items-center gap-3 p-2! md:p-3!`}
                            >
                                <Link
                                    href={`/profile/${person.id}`}
                                    className="hover:text-pulse flex min-w-0 flex-1 items-center gap-3 transition-colors"
                                >
                                    <Avatar
                                        name={person.name}
                                        src={person.image}
                                        className="size-8 text-sm md:size-10 md:text-base"
                                    />
                                    <span className="display truncate text-xl md:text-2xl">
                                        {person.name}
                                    </span>
                                </Link>
                                {person.id !== viewer.id && (
                                    <FollowButton
                                        userId={person.id}
                                        following={followed.has(person.id)}
                                        compact
                                        className="shrink-0"
                                    />
                                )}
                            </li>
                        ))}
                    </ul>
                    {next && (
                        <Link
                            href={`/profile/${id}/follows?tab=${tab}&shown=${next}`}
                            replace
                            scroll={false}
                            className={`${ghostClass} block w-full text-center`}
                        >
                            {t('follows.loadMore')}
                        </Link>
                    )}
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
