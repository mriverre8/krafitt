import { removeRoutineMember, setRoutineMember } from '@/app/actions';
import { MemberMenu } from '@/components/routine/member-menu';
import { Avatar } from '@/components/ui/avatar';
import { getT } from '@/i18n/server';
import { routineMembers } from '@/lib/queries';
import { DEFAULT_ROLE } from '@/lib/roles';
import { cardClass } from '@/lib/ui';
import { Binoculars, Whistle } from 'lucide-react';
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
                        <div className="min-w-0">
                            <Link
                                href={`/profile/${member.id}`}
                                className="hover:text-pulse display block truncate text-xl transition-colors md:text-2xl"
                            >
                                {member.name}
                            </Link>
                            {member.role && (
                                <span className="eyebrow text-muted mt-1 flex items-center gap-1.5">
                                    {member.role === 'scout' ? (
                                        <Binoculars
                                            size={13}
                                            aria-hidden
                                            className="shrink-0"
                                        />
                                    ) : (
                                        <Whistle
                                            size={13}
                                            aria-hidden
                                            className="shrink-0"
                                        />
                                    )}
                                    {t(`role.${member.role}`)}
                                </span>
                            )}
                        </div>
                    </div>

                    <MemberMenu
                        name={member.name}
                        role={member.role ?? DEFAULT_ROLE}
                        setRole={setRoutineMember.bind(
                            null,
                            routineId,
                            member.id
                        )}
                        onRemove={removeRoutineMember.bind(
                            null,
                            routineId,
                            member.id
                        )}
                    />
                </li>
            ))}
        </ul>
    );
}
