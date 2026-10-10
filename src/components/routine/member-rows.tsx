import { cancelRoutineInvite, removeRoutineMember } from '@/app/actions';
import { ActionButton } from '@/components/ui/action-button';
import { Avatar } from '@/components/ui/avatar';
import { getT } from '@/i18n/server';
import { routineInvites, routineMembers } from '@/lib/queries';
import { badgeClass, cardClass, removeButtonClass } from '@/lib/ui';
import { Trash } from 'lucide-react';
import Link from 'next/link';

/** Members first, then whoever was asked and has not answered yet: same card,
    marked pending, and the same button takes the invitation back. */
export async function MemberRows({ routineId }: { routineId: string }) {
    const [members, invites, t] = await Promise.all([
        routineMembers(routineId),
        routineInvites(routineId),
        getT(),
    ]);

    if (members.length === 0 && invites.length === 0)
        return (
            <div className={`${cardClass} p-4!`}>
                <h2 className="display text-4xl">{t('members.emptyTitle')}</h2>
                <p className="text-muted mt-3 max-w-sm text-base">
                    {t('members.empty')}
                </p>
            </div>
        );

    const rows = [
        ...members.map((person) => ({ person, pending: false })),
        ...invites.map((person) => ({ person, pending: true })),
    ];

    return (
        <ul className="space-y-3">
            {rows.map(({ person, pending }) => (
                <li
                    key={person.id}
                    className={`${cardClass} flex items-center gap-3 p-2! md:p-3!`}
                >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Link
                            href={`/profile/${person.id}`}
                            aria-hidden
                            tabIndex={-1}
                            className={`shrink-0 ${pending ? 'opacity-50' : ''}`}
                        >
                            <Avatar
                                name={person.name}
                                src={person.image}
                                className="size-8 text-sm md:size-10 md:text-base"
                            />
                        </Link>
                        <Link
                            href={`/profile/${person.id}`}
                            className={`hover:text-pulse display block min-w-0 truncate text-xl transition-colors md:text-2xl ${
                                pending ? 'text-muted' : ''
                            }`}
                        >
                            {person.name}
                        </Link>
                        {pending && (
                            <span
                                className={`${badgeClass} border-line text-muted shrink-0 border-2`}
                            >
                                {t('routines.pending')}
                            </span>
                        )}
                    </div>

                    <ActionButton
                        action={(pending
                            ? cancelRoutineInvite
                            : removeRoutineMember
                        ).bind(null, routineId, person.id)}
                        label={t('members.remove', { name: person.name })}
                        confirm={{
                            title: t('members.removeTitle'),
                            message: t(
                                pending
                                    ? 'members.cancelInviteConfirm'
                                    : 'members.removeConfirm',
                                { name: person.name }
                            ),
                        }}
                        className={`${removeButtonClass} -my-1.5`}
                    >
                        <Trash
                            size={16}
                            aria-hidden
                        />
                    </ActionButton>
                </li>
            ))}
        </ul>
    );
}
