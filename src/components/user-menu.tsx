'use client';

import { useT } from '@/i18n/use-t';
import { authClient } from '@/lib/auth-client';
import type { Theme } from '@/lib/theme';
import { CalendarDays, Dumbbell, LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Dropdown } from './dropdown';
import { SettingsPanel } from './settings-panel';

const itemClass =
    'flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface2 hover:text-pulse';

/** Every signed-in action behind a single user icon. The app links are
    already in the bar from md up, so the menu only repeats them below it. */
export function UserMenu({ name, theme }: { name: string; theme: Theme }) {
    const t = useT();
    const router = useRouter();
    const [showSettings, setShowSettings] = useState(false);

    return (
        <Dropdown
            label={t('nav.menu')}
            icon={
                <span className="flex items-center gap-1.5">
                    <User
                        size={16}
                        aria-hidden
                    />
                    <span className="hidden max-w-32 truncate text-sm font-semibold md:inline">
                        {name}
                    </span>
                </span>
            }
        >
            {(close) => (
                <>
                    {/* Where you go, then whose account it is, then what you do
                        to it. On a phone this menu is the whole navigation, so
                        the two app links lead; from md up they are already in
                        the bar and drop out, leaving the account items in the
                        same order they were always in. */}
                    <Link
                        href="/"
                        onClick={close}
                        className={`${itemClass} md:hidden`}
                    >
                        <CalendarDays
                            size={14}
                            aria-hidden
                        />
                        {t('nav.today')}
                    </Link>
                    <Link
                        href="/routines"
                        onClick={close}
                        className={`${itemClass} md:hidden`}
                    >
                        <Dumbbell
                            size={14}
                            aria-hidden
                        />
                        {t('nav.routines')}
                    </Link>
                    <Link
                        href="/profile"
                        onClick={close}
                        className={itemClass}
                    >
                        <User
                            size={14}
                            aria-hidden
                        />
                        {t('nav.profile')}
                    </Link>

                    <button
                        type="button"
                        onClick={() => setShowSettings((value) => !value)}
                        aria-expanded={showSettings}
                        className={itemClass}
                    >
                        <Settings
                            size={14}
                            aria-hidden
                        />
                        {t('nav.settings')}
                    </button>
                    {showSettings && (
                        <div className="border-line border-t pt-2 pb-1">
                            <SettingsPanel theme={theme} />
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={async () => {
                            close();
                            await authClient.signOut();
                            router.refresh();
                        }}
                        className={itemClass}
                    >
                        <LogOut
                            size={14}
                            aria-hidden
                        />
                        {t('nav.signOut')}
                    </button>
                </>
            )}
        </Dropdown>
    );
}
