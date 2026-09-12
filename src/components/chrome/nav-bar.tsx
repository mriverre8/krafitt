'use client';

import { useT } from '@/i18n/use-t';
import type { Theme } from '@/lib/theme';
import { iconButtonClass } from '@/lib/ui';
import { showModal } from '@/store/modal';
import { CalendarDays, Dumbbell, Settings } from 'lucide-react';
import Link from 'next/link';
import { Wordmark } from '@/components/ui/wordmark';
import { UserMenu } from '@/components/chrome/user-menu';

const linkClass =
    'flex items-center gap-1.5 font-display text-sm md:text-base font-bold uppercase tracking-wide ' +
    'text-muted transition-colors hover:text-pulse';

export function NavBar({
    userName,
    theme,
}: {
    userName: string | null;
    theme: Theme;
}) {
    const t = useT();
    const signedIn = userName !== null;

    return (
        <nav className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
            <Link
                href="/"
                aria-label="Krafitt"
                className="text-ink"
            >
                <Wordmark className="text-3xl" />
            </Link>

            <div className="flex items-center gap-3">
                {signedIn && (
                    <div className="hidden items-center gap-3 md:flex">
                        <Link
                            href="/"
                            className={linkClass}
                        >
                            <CalendarDays
                                size={14}
                                aria-hidden
                            />
                            {t('nav.today')}
                        </Link>
                        <Link
                            href="/routines"
                            className={linkClass}
                        >
                            <Dumbbell
                                size={14}
                                aria-hidden
                            />
                            {t('nav.routines')}
                        </Link>
                    </div>
                )}

                {userName !== null ? (
                    <UserMenu
                        name={userName}
                        theme={theme}
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => showModal('settings', { theme })}
                        aria-label={t('nav.settings')}
                        className={iconButtonClass}
                    >
                        <Settings
                            size={16}
                            aria-hidden
                        />
                    </button>
                )}
            </div>
        </nav>
    );
}
