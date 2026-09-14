'use client';

/**
 * Google and GitHub sign-in. One button does both sign-up and sign-in: the
 * provider owns the account, so there is nothing for the login/signup tabs
 * above to switch between.
 *
 * Marks are the official brand SVGs in /public; GitHub ships a black and a
 * white invertocat swapped via the .dark variant to stay visible on both themes.
 */

import { useT } from '@/i18n/use-t';
import { authClient } from '@/lib/auth-client';
import { ghostClass } from '@/lib/ui';
import Image from 'next/image';
import { useState } from 'react';

const SOCIAL_PROVIDERS = [
    {
        id: 'google',
        name: 'Google',
        mark: '/google.svg',
        markDark: undefined,
    },
    {
        id: 'github',
        name: 'GitHub',
        mark: '/github-invertocat-black.svg',
        markDark: '/github-invertocat-white.svg',
    },
] as const;

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
