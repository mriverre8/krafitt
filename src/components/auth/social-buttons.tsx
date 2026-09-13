'use client';

/**
 * Google and GitHub sign-in. One button does both sign-up and sign-in: the
 * provider owns the account, so there is nothing for the login/signup tabs
 * above to switch between.
 *
 * The marks are inlined rather than pulled from an icon set because lucide
 * carries no brand logos, and Google's terms only accept its own four-colour G.
 */

import { useT } from '@/i18n/use-t';
import { authClient } from '@/lib/auth-client';
import { ghostClass } from '@/lib/ui';
import { useState } from 'react';

const PROVIDERS = [
    {
        id: 'google',
        name: 'Google',
        Mark: () => (
            <svg
                viewBox="0 0 48 48"
                width="18"
                height="18"
                aria-hidden
            >
                <path
                    fill="#EA4335"
                    d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.7 30.2.5 24 .5 14.6.5 6.5 5.8 2.6 13.6l7.8 6c1.9-5.7 7.2-10.1 13.6-10.1z"
                />
                <path
                    fill="#4285F4"
                    d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.700000000000001 7-17.4z"
                />
                <path
                    fill="#FBBC05"
                    d="M10.4 28.4c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-7.8-6C.9 16.8 0 20.3 0 24s.9 7.2 2.6 10.4l7.8-6z"
                />
                <path
                    fill="#34A853"
                    d="M24 47.5c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.4 0-11.7-4.4-13.6-10.1l-7.8 6C6.5 42.2 14.6 47.5 24 47.5z"
                />
            </svg>
        ),
    },
    {
        id: 'github',
        name: 'GitHub',
        Mark: () => (
            <svg
                viewBox="0 0 16 16"
                width="18"
                height="18"
                fill="currentColor"
                aria-hidden
            >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
        ),
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
        <div className="mb-5 space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
                {PROVIDERS.map(({ id, name, Mark }) => (
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
                        <Mark />
                        {t('auth.continueWith', { provider: name })}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <span className="bg-line h-px flex-1" />
                <span className="eyebrow text-muted">{t('auth.or')}</span>
                <span className="bg-line h-px flex-1" />
            </div>
        </div>
    );
}
