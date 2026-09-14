'use client';

import { useT } from '@/i18n/use-t';
import { authClient } from '@/lib/auth-client';
import { SOCIAL_PROVIDERS } from '@/lib/social-providers';
import { ghostClass } from '@/lib/ui';
import Image from 'next/image';
import { useState } from 'react';

/**
 * Google and GitHub sign-in. One button does both sign-up and sign-in: the
 * provider owns the account, so there is nothing for the login/signup tabs
 * above to switch between.
 *
 * A provider with two marks ships both and lets CSS pick: the theme is a class
 * on <html>, so `dark:` swaps them with no state and no flash of the wrong one
 * on the server render. The marks are decorative — the button says whose they
 * are right beside them.
 */
export function SocialButtons({
    onError,
}: {
    onError: (message?: string) => void;
}) {
    const t = useT();
    const [pending, setPending] = useState<string | undefined>();

    return (
        <div className="mt-5 space-y-3">
            <div className="flex items-center gap-3">
                <span className="bg-line h-px flex-1" />
                <span className="eyebrow text-muted">{t('auth.or')}</span>
                <span className="bg-line h-px flex-1" />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
                {SOCIAL_PROVIDERS.map(({ id, name, mark, markDark }) => (
                    <button
                        key={id}
                        type="button"
                        disabled={pending !== undefined}
                        onClick={async () => {
                            setPending(id);
                            onError(undefined);
                            // On success the browser leaves for the provider,
                            // so only the failure path ever gets here.
                            const { error } = await authClient.signIn.social({
                                provider: id,
                                callbackURL: '/',
                            });
                            setPending(undefined);
                            if (error)
                                onError(error.message ?? t('auth.failed'));
                        }}
                        className={`${ghostClass} flex items-center justify-center gap-2 py-3`}
                    >
                        <Image
                            src={mark}
                            alt=""
                            aria-hidden
                            width={18}
                            height={18}
                            // An SVG has nothing for the optimizer to do, and
                            // it refuses to serve one without being told to.
                            unoptimized
                            className={markDark ? 'dark:hidden' : undefined}
                        />
                        {markDark && (
                            <Image
                                src={markDark}
                                alt=""
                                aria-hidden
                                width={18}
                                height={18}
                                unoptimized
                                className="hidden dark:block"
                            />
                        )}
                        {t('auth.continueWith', { provider: name })}
                    </button>
                ))}
            </div>
        </div>
    );
}
