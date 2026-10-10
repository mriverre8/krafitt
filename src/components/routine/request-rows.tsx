import { acceptRequest, declineRequest } from '@/app/actions';
import { ActionButton } from '@/components/ui/action-button';
import { Avatar } from '@/components/ui/avatar';
import { getT } from '@/i18n/server';
import type { requestsOf } from '@/lib/queries';
import { cardClass, ghostClass, primaryClass } from '@/lib/ui';
import { Check, X } from 'lucide-react';
import Link from 'next/link';

export async function RequestRows({
    requests,
}: {
    requests: Awaited<ReturnType<typeof requestsOf>>;
}) {
    const t = await getT();

    if (requests.length === 0)
        return (
            <div className={`${cardClass} p-4!`}>
                <h2 className="display text-4xl">{t('requests.emptyTitle')}</h2>
                <p className="text-muted mt-3 max-w-sm text-base">
                    {t('requests.empty')}
                </p>
            </div>
        );

    return (
        <ul className="space-y-3">
            {requests.map(({ id, kind, addSender, routine }) => {
                const sender = routine.creator;
                const what =
                    kind === 'member'
                        ? 'requests.member'
                        : addSender
                          ? 'requests.sendWithMember'
                          : 'requests.send';
                return (
                    <li
                        key={id}
                        className={`${cardClass} flex flex-wrap items-center gap-3 p-2! md:p-3!`}
                    >
                        <div className="flex min-w-0 flex-1 basis-60 items-start gap-3">
                            <Link
                                href={`/profile/${sender.id}`}
                                aria-hidden
                                tabIndex={-1}
                                className="shrink-0"
                            >
                                <Avatar
                                    name={sender.name}
                                    src={sender.image}
                                    className="size-8 text-sm md:size-10 md:text-base"
                                />
                            </Link>
                            <div className="min-w-0">
                                <Link
                                    href={`/profile/${sender.id}`}
                                    className="hover:text-pulse display block truncate text-xl transition-colors md:text-2xl"
                                >
                                    {sender.name}
                                </Link>
                                <p className="text-muted text-sm">
                                    {t(what, { routine: routine.name })}
                                </p>
                            </div>
                        </div>

                        <div className="ml-auto flex shrink-0 gap-2">
                            <ActionButton
                                action={declineRequest.bind(null, id)}
                                className={`${ghostClass} flex items-center gap-1.5 px-3! py-1.5! text-xs!`}
                            >
                                <X
                                    size={14}
                                    aria-hidden
                                />
                                {t('requests.decline')}
                            </ActionButton>
                            <ActionButton
                                action={acceptRequest.bind(null, id)}
                                className={`${primaryClass} flex items-center gap-1.5 px-3! py-1.5! text-xs!`}
                            >
                                <Check
                                    size={14}
                                    aria-hidden
                                />
                                {t('requests.accept')}
                            </ActionButton>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
