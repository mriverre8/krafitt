'use client';

import { useT } from '@/i18n/use-t';
import type { Theme } from '@/lib/theme';
import { CalendarDays, Dumbbell, Settings } from 'lucide-react';
import Link from 'next/link';
import { Dropdown } from './dropdown';
import { SettingsPanel } from './settings-panel';
import { SignOutButton } from './sign-out-button';
import { UserMenu } from './user-menu';

const linkClass =
    'flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-blaze';

export function NavBar({
    signedIn,
    theme,
}: {
    signedIn: boolean;
    theme: Theme;
}) {
    const t = useT();

    return (
        <nav className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
            <Link
                href="/"
                className="display text-ink hover:text-blaze text-3xl transition-colors"
            >
                Kra<span className="text-blaze">fitt</span>
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
                        <SignOutButton />
                    </div>
                )}

                {/* Signed in, the mobile settings live inside the user menu, so
                    this control only needs to show up from md up. */}
                <div className={signedIn ? 'hidden md:block' : undefined}>
                    <Dropdown
                        label={t('nav.settings')}
                        icon={
                            <Settings
                                size={16}
                                aria-hidden
                            />
                        }
                    >
                        {() => <SettingsPanel theme={theme} />}
                    </Dropdown>
                </div>

                {signedIn && (
                    <div className="md:hidden">
                        <UserMenu theme={theme} />
                    </div>
                )}
            </div>
        </nav>
    );
}
