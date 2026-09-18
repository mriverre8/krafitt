import { FollowButton } from '@/components/profile/follow-button';
import { Avatar } from '@/components/ui/avatar';
import { getT } from '@/i18n/server';
import { loadMore } from '@/lib/pagination';
import { followList, followingAmong, type FollowTab } from '@/lib/queries';
import { cardClass, ghostClass } from '@/lib/ui';
import Link from 'next/link';

export async function FollowRows({
    id,
    tab,
    viewerId,
    asked,
    total,
}: {
    id: string;
    tab: FollowTab;
    viewerId: string;
    asked: string | string[] | undefined;
    total: number;
}) {
    const t = await getT();
    const { shown, next } = loadMore(asked, total);
    const people = await followList(id, tab, { skip: 0, take: shown });
    const followed = await followingAmong(
        viewerId,
        people.map((person) => person.id)
    );

    if (people.length === 0)
        return (
            <p className="border-line text-muted rounded-md border-2 border-dashed p-6 text-center text-sm">
                {t(
                    tab === 'followers'
                        ? 'follows.noFollowers'
                        : 'follows.noFollowing'
                )}
            </p>
        );

    return (
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
                        {person.id !== viewerId && (
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
    );
}
