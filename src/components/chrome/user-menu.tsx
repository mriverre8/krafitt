'use client';

import { useT } from '@/i18n/use-t';
import { authClient } from '@/lib/auth-client';
import type { Theme } from '@/lib/theme';
import { CalendarDays, Dumbbell, LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Dropdown } from '@/components/ui/dropdown';
import { showModal } from '@/store/modal';

const itemClass =
    'flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface2 hover:text-pulse';

/** Every signed-in action behind a single user icon. The app links are
    already in the bar from md up, so the menu only repeats them below it. */
export function UserMenu({ name, theme }: { name: string; theme: Theme }) {
    const t = useT();
    const router = useRouter();

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
                        onClick={() => {
                            close();
                            showModal('settings', { theme });
                        }}
                        className={itemClass}
                    >
                        <Settings
                            size={14}
                            aria-hidden
                        />
                        {t('nav.settings')}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            close();
                            showModal('confirm', {
                                title: t('nav.signOut'),
                                message: t('nav.signOutConfirm'),
                                confirmLabel: t('nav.signOut'),
                                onConfirm: async () => {
                                    await authClient.signOut();
                                    router.refresh();
                                },
                            });
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
