'use client';

import { useT } from '@/i18n/use-t';
import { ClipboardList, House, User, Zap } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type RefObject } from 'react';

const shownClass = 'hidden standalone:max-md:flex in-data-editing:hidden!';

/**
 * While the sticky bar behind `ref` is pinned to the bottom edge, the nav rides
 * up on top of it; once the bar settles back into the page, the nav drops
 * back to its own spot. The bar pins at -1px (stickyBarClass), so pinned is
 * "not fully visible, and hanging off the bottom".
 */
export function useLiftNav(ref: RefObject<HTMLElement | null>) {
    useEffect(() => {
        const bar = ref.current;
        if (!bar || typeof IntersectionObserver === 'undefined') return;
        const root = document.documentElement;
        // ponytail: height read on each pin/unpin only; add a ResizeObserver if the bar ever changes height while pinned
        const io = new IntersectionObserver(
            ([e]) => {
                const pinned =
                    e.intersectionRatio < 1 &&
                    e.boundingClientRect.bottom >
                        (e.rootBounds?.bottom ?? innerHeight);
                root.style.setProperty(
                    '--sticky-bar',
                    pinned ? `${bar.offsetHeight}px` : '0px'
                );
            },
            { threshold: 1 }
        );
        io.observe(bar);
        return () => {
            io.disconnect();
            root.style.removeProperty('--sticky-bar');
        };
    }, [ref]);
}

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
            href: '/workouts',
            label: t('nav.workouts'),
            Icon: Zap,
            active: pathname.startsWith('/workouts'),
        },
        {
            href: '/routines',
            label: t('nav.routines'),
            Icon: ClipboardList,
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

    // Scrolling down tucks the nav away, scrolling up brings it back. The
    // position is clamped so iOS rubber-banding past either end isn't read as
    // a direction, and small moves are ignored so a resting thumb can't flicker it.
    const [tucked, setTucked] = useState(false);
    useEffect(() => {
        const clamped = () =>
            Math.min(
                Math.max(scrollY, 0),
                document.documentElement.scrollHeight - innerHeight
            );
        let last = clamped();
        const onScroll = () => {
            const y = clamped();
            if (Math.abs(y - last) < 8) return;
            setTucked(y > last);
            last = y;
        };
        addEventListener('scroll', onScroll, { passive: true });
        return () => removeEventListener('scroll', onScroll);
    }, []);

    return (
        <>
            <div
                aria-hidden
                className={`${shownClass} h-[calc(5.5rem+env(safe-area-inset-bottom))] shrink-0`}
            />
            <nav
                className={`${shownClass} bg-bg/60 fixed inset-x-7 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 h-14 gap-1 rounded-md transition-[translate] duration-300 ease-out motion-reduce:transition-none ${
                    tucked
                        ? 'translate-y-[calc(100%+max(1rem,env(safe-area-inset-bottom))+1px)]'
                        : '-translate-y-(--sticky-bar,0px)'
                } border border-white/25 p-1.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_8px_24px_rgb(0_0_0/0.18)] backdrop-blur-lg backdrop-saturate-150 dark:border-white/10`}
            >
                <div
                    aria-hidden
                    className={`bg-surface2/70 absolute inset-y-1.5 left-1.5 w-[calc((100%-1.5rem)/4)] rounded-md transition-[translate,opacity] duration-300 ease-out motion-reduce:transition-none ${
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
                        aria-label={label}
                        title={label}
                        className={`relative flex flex-1 items-center justify-center rounded-md transition-colors ${
                            active
                                ? 'text-pulse'
                                : 'text-muted hover:text-pulse'
                        }`}
                    >
                        <Icon
                            size={20}
                            aria-hidden
                        />
                    </Link>
                ))}
            </nav>
        </>
    );
}
