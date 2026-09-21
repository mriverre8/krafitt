'use client';

import { findRoutineMember, setRoutineMember } from '@/app/actions';
import { ActionButton } from '@/components/ui/action-button';
import { Avatar } from '@/components/ui/avatar';
import { FormError } from '@/components/ui/form-error';
import { useT } from '@/i18n/use-t';
import { EMAIL_PATTERN } from '@/lib/constants';
import { DEFAULT_ROLE } from '@/lib/roles';
import {
    cardClass,
    ghostClass,
    inputClass,
    labelClass,
    primaryClass,
} from '@/lib/ui';
import { Search, UserPlus } from 'lucide-react';
import { useActionState, useState } from 'react';

export function MemberSearch({ routineId }: { routineId: string }) {
    const t = useT();
    const [state, formAction, pending] = useActionState(
        findRoutineMember.bind(null, routineId),
        {}
    );
    const [email, setEmail] = useState('');
    const [dismissed, setDismissed] = useState<string | null>(null);

    const found = state.found?.id === dismissed ? undefined : state.found;

    return (
        <div className="space-y-3">
            <form action={formAction}>
                <label
                    htmlFor="member-email"
                    className={`${labelClass} mb-1 block`}
                >
                    {t('members.searchLabel')}
                </label>
                <div className="flex gap-2">
                    <input
                        id="member-email"
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="off"
                        pattern={EMAIL_PATTERN}
                        required
                        value={email}
                        onChange={(event) => {
                            setEmail(event.target.value);
                            setDismissed(null);
                        }}
                        placeholder={t('members.emailPlaceholder')}
                        className={inputClass}
                    />
                    <button
                        type="submit"
                        disabled={pending}
                        aria-label={t('members.search')}
                        title={t('members.search')}
                        className={`${ghostClass} shrink-0`}
                    >
                        <Search
                            size={18}
                            aria-hidden
                        />
                    </button>
                </div>
            </form>

            <FormError message={state.error} />
            {state.notice && (
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
                            await setRoutineMember(
                                routineId,
                                found.id,
                                DEFAULT_ROLE
                            );
                            setEmail('');
                            setDismissed(found.id);
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
