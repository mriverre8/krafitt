'use client';

import { useT } from '@/i18n/use-t';
import { authClient } from '@/lib/auth-client';
import type { Theme } from '@/lib/theme';
import { CalendarDays, Dumbbell, LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Dropdown } from '@/components/ui/dropdown';
import { menuItemClass as itemClass } from '@/lib/ui';
import { showModal } from '@/store/modal';

/** Every signed-in action behind a single user icon. The app links are
    already in the bar from md up, so the menu only repeats them below it. */
export function UserMenu({
    name,
    image,
    theme,
}: {
    name: string;
    image: string | null;
    theme: Theme;
}) {
    const t = useT();
    const router = useRouter();

    return (
        <Dropdown
            label={t('nav.menu')}
            icon={
                <span className="flex items-center gap-1.5">
                    {image ? (
                        <Avatar
                            name={name}
                            src={image}
                            className="size-5"
                        />
                    ) : (
                        <User
                            size={16}
                            aria-hidden
                        />
                    )}
                    <span className="max-w-32 truncate text-sm font-semibold">
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
                            showModal('settings', {
                                theme,
                                userName: name,
                                userImage: image,
                            });
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
