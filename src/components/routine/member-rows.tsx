import { removeRoutineMember } from '@/app/actions';
import { ActionButton } from '@/components/ui/action-button';
import { Avatar } from '@/components/ui/avatar';
import { getT } from '@/i18n/server';
import { routineMembers } from '@/lib/queries';
import { cardClass, removeButtonClass } from '@/lib/ui';
import { Trash } from 'lucide-react';
import Link from 'next/link';

export async function MemberRows({ routineId }: { routineId: string }) {
    const [members, t] = await Promise.all([routineMembers(routineId), getT()]);

    if (members.length === 0)
        return (
            <div className={`${cardClass} p-4!`}>
                <h2 className="display text-4xl">{t('members.emptyTitle')}</h2>
                <p className="text-muted mt-3 max-w-sm text-base">
                    {t('members.empty')}
                </p>
            </div>
        );

    return (
        <ul className="space-y-3">
            {members.map((member) => (
                <li
                    key={member.id}
                    className={`${cardClass} flex items-center gap-3 p-2! md:p-3!`}
                >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <Link
                            href={`/profile/${member.id}`}
                            aria-hidden
                            tabIndex={-1}
                            className="shrink-0"
                        >
                            <Avatar
                                name={member.name}
                                src={member.image}
                                className="size-8 text-sm md:size-10 md:text-base"
                            />
                        </Link>
                        <Link
                            href={`/profile/${member.id}`}
                            className="hover:text-pulse display block min-w-0 truncate text-xl transition-colors md:text-2xl"
                        >
                            {member.name}
                        </Link>
                    </div>

                    <ActionButton
                        action={removeRoutineMember.bind(
                            null,
                            routineId,
                            member.id
                        )}
                        label={t('members.remove', { name: member.name })}
                        confirm={{
                            title: t('members.removeTitle'),
                            message: t('members.removeConfirm', {
                                name: member.name,
                            }),
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
