'use client';

import { useT } from '@/i18n/use-t';
import { Dumbbell, House, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const shownClass = 'hidden standalone:max-md:flex in-data-editing:hidden!';

export function BottomNav({ userId }: { userId: string }) {
    const t = useT();
    const pathname = usePathname();
    const profile = `/profile/${userId}`;

    const links = [
        {
            href: '/',
            label: t('nav.home'),
            Icon: House,
            active: pathname === '/',
        },
        {
            href: '/routines',
            label: t('nav.routines'),
            Icon: Dumbbell,
            active: pathname.startsWith('/routines'),
        },
        {
            href: profile,
            label: t('nav.profile'),
            Icon: User,
            active: pathname.startsWith(profile),
        },
    ];
    const activeIndex = links.findIndex((link) => link.active);

    return (
        <>
            <div
                aria-hidden
                className={`${shownClass} h-[calc(5.25rem+env(safe-area-inset-bottom))] shrink-0`}
            />
            <nav
                className={`${shownClass} bg-bg/60 fixed inset-x-7 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 h-13 gap-1 rounded-md border border-white/25 p-1.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_8px_24px_rgb(0_0_0/0.18)] backdrop-blur-lg backdrop-saturate-150 dark:border-white/10`}
            >
                <div
                    aria-hidden
                    className={`bg-surface2/70 absolute inset-y-1.5 left-1.5 w-[calc((100%-1.25rem)/3)] rounded-md transition-[translate,opacity] duration-300 ease-out motion-reduce:transition-none ${
                        activeIndex < 0 ? 'opacity-0' : ''
                    }`}
                    style={{
                        translate: `calc(${Math.max(activeIndex, 0)} * (100% + 0.25rem))`,
                    }}
                />
                {links.map(({ href, label, Icon, active }) => (
                    <Link
                        key={href}
                        href={href}
                        aria-current={active ? 'page' : undefined}
                        className={`font-display relative flex flex-1 items-center justify-center gap-1.5 rounded-md text-sm font-bold tracking-wide uppercase transition-colors ${
                            active
                                ? 'text-pulse'
                                : 'text-muted hover:text-pulse'
                        }`}
                    >
                        <Icon
                            size={16}
                            aria-hidden
                        />
                        {label}
                    </Link>
                ))}
            </nav>
        </>
    );
}
