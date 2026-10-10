'use client';

import { findRoutineMember, inviteRoutineMember } from '@/app/actions';
import { ActionButton } from '@/components/ui/action-button';
import { Avatar } from '@/components/ui/avatar';
import { FormError } from '@/components/ui/form-error';
import { useT } from '@/i18n/use-t';
import { EMAIL_PATTERN } from '@/lib/constants';
import { normalEmail } from '@/lib/utils';
import {
    cardClass,
    foundSearchFrameClass,
    labelClass,
    primaryClass,
    searchFoundClass,
    searchFrameClass,
    searchInputClass,
    searchSubmitClass,
} from '@/lib/ui';
import { CircleCheck, Search, UserPlus } from 'lucide-react';
import { useActionState, useState } from 'react';

export function MemberSearch({ routineId }: { routineId: string }) {
    const t = useT();
    const [state, formAction, pending] = useActionState(
        findRoutineMember.bind(null, routineId),
        {}
    );
    const [email, setEmail] = useState('');
    const [searched, setSearched] = useState<string | null>(null);

    const current =
        !pending && searched !== null && normalEmail(email) === searched;
    const found = current ? state.found : undefined;

    return (
        <div className="space-y-3">
            <form
                action={formAction}
                onSubmit={(event) => {
                    const asked = normalEmail(email);
                    if (asked === searched) event.preventDefault();
                    else setSearched(asked);
                }}
            >
                <label
                    htmlFor="member-email"
                    className={`${labelClass} mb-1 block`}
                >
                    {t('members.searchLabel')}
                </label>
                <div
                    className={found ? foundSearchFrameClass : searchFrameClass}
                >
                    <input
                        id="member-email"
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="off"
                        pattern={EMAIL_PATTERN}
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder={t('members.emailPlaceholder')}
                        className={searchInputClass}
                    />
                    {found ? (
                        <span className={searchFoundClass}>
                            <CircleCheck
                                size={18}
                                strokeWidth={2.5}
                                role="img"
                                aria-label={t('routine.sendFound')}
                            />
                        </span>
                    ) : (
                        <button
                            type="submit"
                            disabled={pending || !email.trim()}
                            aria-label={t('members.search')}
                            title={t('members.search')}
                            className={searchSubmitClass}
                        >
                            <Search
                                size={18}
                                strokeWidth={2.5}
                                aria-hidden
                            />
                        </button>
                    )}
                </div>
            </form>

            {current && <FormError message={state.error} />}
            {current && state.notice && (
                <p
                    role="status"
                    className="text-muted text-sm font-semibold"
                >
                    {state.notice}
                </p>
            )}

            {found && (
                <div
                    className={`${cardClass} flex items-center gap-3 p-2! md:p-3!`}
                >
                    <Avatar
                        name={found.name}
                        src={found.image}
                        className="size-8 text-sm md:size-10 md:text-base"
                    />
                    <span className="display min-w-0 flex-1 truncate text-xl md:text-2xl">
                        {found.name}
                    </span>
                    <ActionButton
                        action={async () => {
                            await inviteRoutineMember(routineId, found.id);
                            setEmail('');
                            setSearched(null);
                        }}
                        className={`${primaryClass} flex shrink-0 items-center gap-1 px-3! py-1! text-xs! md:gap-1.5 md:px-5! md:py-1.5! md:text-sm!`}
                    >
                        <UserPlus
                            size={14}
                            aria-hidden
                        />
                        {t('members.add')}
                    </ActionButton>
                </div>
            )}
        </div>
    );
}
