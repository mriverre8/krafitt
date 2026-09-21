import { removeRoutineMember, setRoutineMember } from '@/app/actions';
import { MemberRoleSelect } from '@/components/routine/member-role-select';
import { ActionButton } from '@/components/ui/action-button';
import { Avatar } from '@/components/ui/avatar';
import { getT } from '@/i18n/server';
import { routineMembers } from '@/lib/queries';
import { DEFAULT_ROLE } from '@/lib/roles';
import { cardClass, removeButtonClass } from '@/lib/ui';
import { X } from 'lucide-react';
import Link from 'next/link';

export async function MemberRows({ routineId }: { routineId: string }) {
    const [members, t] = await Promise.all([routineMembers(routineId), getT()]);

    if (members.length === 0)
        return (
            <div className={`${cardClass} p-8!`}>
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
                    <Link
                        href={`/profile/${member.id}`}
                        className="hover:text-pulse flex min-w-0 flex-1 items-center gap-3 transition-colors"
                    >
                        <Avatar
                            name={member.name}
                            src={member.image}
                            className="size-8 text-sm md:size-10 md:text-base"
                        />
                        <span className="display truncate text-xl md:text-2xl">
                            {member.name}
                        </span>
                    </Link>

                    <MemberRoleSelect
                        name={member.name}
                        role={member.role ?? DEFAULT_ROLE}
                        setRole={setRoutineMember.bind(
                            null,
                            routineId,
                            member.id
                        )}
                    />
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
                        className={removeButtonClass}
                    >
                        <X
                            size={16}
                            aria-hidden
                        />
                    </ActionButton>
                </li>
            ))}
        </ul>
    );
}
