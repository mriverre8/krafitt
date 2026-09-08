'use client';

import { useT } from '@/i18n/use-t';
import { authClient } from '@/lib/auth-client';
import { inputClass, primaryClass } from '@/lib/ui';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FormError } from './form-error';

type Mode = 'login' | 'signup';

export function AuthForms() {
    const t = useT();
    const router = useRouter();
    const [mode, setMode] = useState<Mode>('login');
    const [error, setError] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const email = String(data.get('email'));
        const password = String(data.get('password'));

        setLoading(true);
        setError(undefined);
        const result =
            mode === 'login'
                ? await authClient.signIn.email({ email, password })
                : await authClient.signUp.email({
                      email,
                      password,
                      name: String(data.get('name')),
                  });
        setLoading(false);

        if (result.error) setError(result.error.message ?? t('auth.failed'));
        else router.refresh();
    }

    return (
        <div className="border-line border-l-volt bg-surface rounded-md border border-l-[3px] p-5">
            <div className="border-line bg-surface2 mb-5 flex gap-1 rounded-md border p-1">
                {(['login', 'signup'] as const).map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => {
                            setMode(option);
                            setError(undefined);
                        }}
                        aria-pressed={mode === option}
                        className={`font-display flex-1 rounded-sm py-2.5 text-base font-bold tracking-wide uppercase transition-colors ${
                            mode === option
                                ? 'bg-volt text-on-volt'
                                : 'text-muted hover:text-ink'
                        }`}
                    >
                        {option === 'login'
                            ? t('auth.login')
                            : t('auth.signup')}
                    </button>
                ))}
            </div>

            <form
                onSubmit={onSubmit}
                className="space-y-3"
            >
                {mode === 'signup' && (
                    <input
                        name="name"
                        required
                        aria-label={t('auth.name')}
                        placeholder={t('auth.name')}
                        className={inputClass}
                    />
                )}
                <input
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    aria-label={t('auth.email')}
                    placeholder={t('auth.email')}
                    className={inputClass}
                />
                <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete={
                        mode === 'login' ? 'current-password' : 'new-password'
                    }
                    aria-label={t('auth.password')}
                    placeholder={t('auth.passwordPlaceholder')}
                    className={inputClass}
                />

                <FormError message={error} />

                <button
                    type="submit"
                    disabled={loading}
                    className={`${primaryClass} w-full py-4 text-xl`}
                >
                    {mode === 'login'
                        ? t('auth.submitLogin')
                        : t('auth.submitSignup')}
                </button>
            </form>
        </div>
    );
}
