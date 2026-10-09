'use client';

import { useT } from '@/i18n/use-t';
import { EMAIL_PATTERN } from '@/lib/constants';
import { normalEmail } from '@/lib/utils';
import type { FoundUser } from '@/lib/forms';
import {
    cardClass,
    foundSearchFrameClass,
    ghostClass,
    labelClass,
    primaryClass,
    searchFoundClass,
    searchFrameClass,
    searchInputClass,
    searchSubmitClass,
} from '@/lib/ui';
import { Modal } from '@/components/modal/modal';
import { Avatar } from '@/components/ui/avatar';
import { FormError } from '@/components/ui/form-error';
import { CircleCheck, Search, Send } from 'lucide-react';
import { useState, useTransition } from 'react';

export type SendRoutineModalProps = {
    find: (email: string) => Promise<{ found?: FoundUser; error?: string }>;
    send: (userId: string, addMe: boolean) => Promise<unknown>;
    onClose: () => void;
};

export function SendRoutineModal({
    find,
    send,
    onClose,
}: SendRoutineModalProps) {
    const t = useT();
    const [email, setEmail] = useState('');
    const [found, setFound] = useState<{ email: string; user: FoundUser }>();
    const [addMe, setAddMe] = useState(false);
    const [error, setError] = useState<string>();
    const [pending, start] = useTransition();

    const matched = found !== undefined && normalEmail(email) === found.email;

    return (
        <Modal
            title={t('routine.send')}
            onClose={onClose}
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    const asked = normalEmail(email);
                    start(async () => {
                        const answer = await find(asked);
                        setError(answer.error);
                        if (answer.found)
                            setFound({ email: asked, user: answer.found });
                    });
                }}
            >
                <label
                    htmlFor="send-email"
                    className={`${labelClass} mb-1 block`}
                >
                    {t('routine.sendLabel')}
                </label>
                <div
                    className={
                        matched ? foundSearchFrameClass : searchFrameClass
                    }
                >
                    <input
                        id="send-email"
                        type="email"
                        inputMode="email"
                        autoComplete="off"
                        pattern={EMAIL_PATTERN}
                        required
                        autoFocus
                        value={email}
                        onChange={(event) => {
                            setEmail(event.target.value);
                            setError(undefined);
                        }}
                        placeholder={t('members.emailPlaceholder')}
                        className={searchInputClass}
                    />
                    {matched ? (
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
                <div className="mt-1.5 empty:hidden">
                    <FormError message={error} />
                </div>
                {matched && (
                    <div
                        className={`${cardClass} mt-2 flex items-center gap-2 px-2! py-1.5!`}
                    >
                        <Avatar
                            name={found.user.name}
                            src={found.user.image}
                            className="size-6 text-[0.625rem]"
                        />
                        <span className="display min-w-0 flex-1 truncate text-lg">
                            {found.user.name}
                        </span>
                    </div>
                )}
            </form>

            <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                    type="checkbox"
                    checked={addMe}
                    onChange={(event) => setAddMe(event.target.checked)}
                    className="accent-pulse size-4"
                />
                {t('routine.sendAddMe')}
            </label>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className={ghostClass}
                >
                    {t('common.cancel')}
                </button>
                <button
                    type="button"
                    disabled={!matched || pending}
                    onClick={() =>
                        start(async () => {
                            await send(found!.user.id, addMe);
                            onClose();
                        })
                    }
                    className={`${primaryClass} flex items-center justify-center gap-2 py-2.5 text-sm`}
                >
                    <Send
                        size={14}
                        aria-hidden
                    />
                    {t('routine.send')}
                </button>
            </div>
        </Modal>
    );
}
