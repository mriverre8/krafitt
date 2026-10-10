'use client';

import { useT } from '@/i18n/use-t';
import type { TKey } from '@/i18n/config';
import { cardClass, eyebrowLine } from '@/lib/ui';
import type { ReactNode } from 'react';

// Every height below is the height of what lands in its place — the type's
// line box, the control's box — so the page arrives without a single row
// moving. `.display` sets a 0.9 line-height, which is where the odd decimals
// come from: text-6xl is 54px, 5xl 43.2, 4xl 32.4, 3xl 27, 2xl 21.6.

export function Bar({ className = '' }: { className?: string }) {
    return <div className={`bg-line animate-pulse rounded-xs ${className}`} />;
}

/** One line of text: the box is the line's real height and the bar sits in it
    a little shorter, so lines that touch still read as separate lines. */
export function Line({
    className = '',
    bar = '',
}: {
    className?: string;
    bar?: string;
}) {
    return (
        <div className={`flex items-center ${className}`}>
            <Bar className={`h-3/5 ${bar}`} />
        </div>
    );
}

/** Copy that is the same whatever loads, set for real: a title that wraps on a
    phone wraps here too, so nothing under it moves when the page lands. */
export function Copy({ k, className }: { k: TKey; className?: string }) {
    const t = useT();
    return <p className={className}>{t(k)}</p>;
}

/** `BackButton`: 44px of ghost button plus its mb-4. A box rather than a
    margin, so the mt-5 of a heading under it adds on as it does on the page. */
export function BackBar() {
    return (
        <div className="h-15">
            <Bar className="h-11 w-25 rounded-md" />
        </div>
    );
}

/** The underlined tab row: text-sm, pb-2 and the 2px rule. */
export function TabsSkeleton() {
    return (
        <div className="border-line flex gap-6 border-b-2 pb-2">
            <Bar className="h-5 w-24" />
            <Bar className="h-5 w-28" />
        </div>
    );
}

/** `SearchBar`, with the row of filter chips when the page has one. */
export function SearchSkeleton({ filter = false }: { filter?: boolean }) {
    return (
        <div className="space-y-3">
            <Bar className="h-12 w-full rounded-md" />
            {filter && (
                <div className="flex gap-2 py-0.5">
                    {[0, 1, 2].map((i) => (
                        <Bar
                            key={i}
                            className="h-10 w-24 rounded-md"
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function Skeleton({ children }: { children: ReactNode }) {
    const t = useT();

    return (
        <div
            role="status"
            aria-busy="true"
        >
            <span className="sr-only">{t('common.loading')}</span>
            <div
                aria-hidden
                className="space-y-6"
            >
                {children}
            </div>
        </div>
    );
}

/** `RoutineCard`, or `RoutineSharedCard` with `badge` off. Drawn with the
    progress ladder: only an open-ended routine goes without one. */
export function RoutineCardSkeleton({
    accent = false,
    badge = true,
}: {
    accent?: boolean;
    badge?: boolean;
}) {
    return (
        <div
            className={`${cardClass} ${
                accent ? 'border-l-volt border-l-[6px]' : ''
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <Bar className="h-6.75 w-2/3" />
                    <Bar className={`mt-1.5 w-1/3 ${eyebrowLine}`} />
                </div>
                {badge && <Bar className="h-[25.2px] w-24 shrink-0" />}
            </div>
            <div className="mt-5 space-y-2">
                <Bar className="h-2 w-full" />
                <Bar className="h-5 w-28" />
            </div>
        </div>
    );
}

export function RoutineListSkeleton({ badge = true }: { badge?: boolean }) {
    return (
        <div className="space-y-3">
            <RoutineCardSkeleton
                accent={badge}
                badge={badge}
            />
            <RoutineCardSkeleton badge={badge} />
            <RoutineCardSkeleton badge={badge} />
        </div>
    );
}

/** `SharedOwnerBlocks`: a heading per owner over a few of their routines. */
export function SharedOwnersSkeleton() {
    return (
        <div className="space-y-8">
            {[0, 1].map((i) => (
                <div
                    key={i}
                    className="space-y-3"
                >
                    <div className="flex items-center gap-2.5">
                        <Bar className="size-8 shrink-0 rounded-md" />
                        <Bar className="h-[21.6px] w-36" />
                    </div>
                    <RoutineCardSkeleton badge={false} />
                    <RoutineCardSkeleton badge={false} />
                </div>
            ))}
        </div>
    );
}

/** A row with an avatar and a name: follows and members alike. */
export function FollowRowsSkeleton() {
    return (
        <ul className="space-y-3">
            {[0, 1, 2].map((i) => (
                <li
                    key={i}
                    className={`${cardClass} flex items-center gap-3 p-2! md:p-3!`}
                >
                    <Bar className="size-8 shrink-0 rounded-md! md:size-10" />
                    <Bar className="h-7 w-40" />
                </li>
            ))}
        </ul>
    );
}

/** `RequestRows`: who and what over two lines, and the two buttons, which
    drop under them on a phone the same way the real ones do. */
export function RequestRowsSkeleton() {
    return (
        <ul className="space-y-3">
            {[0, 1, 2].map((i) => (
                <li
                    key={i}
                    className={`${cardClass} flex flex-wrap items-center gap-3 p-2! md:p-3!`}
                >
                    <div className="flex min-w-0 flex-1 basis-60 items-start gap-3">
                        <Bar className="size-8 shrink-0 rounded-md md:size-10" />
                        <div className="min-w-0 flex-1">
                            <Bar className="h-4.5 w-32 md:h-[21.6px]" />
                            <Line
                                className="h-5"
                                bar="w-48 max-w-full"
                            />
                        </div>
                    </div>
                    <div className="ml-auto flex shrink-0 gap-2">
                        <Bar className="h-8 w-22 rounded-md" />
                        <Bar className="h-8 w-22 rounded-md" />
                    </div>
                </li>
            ))}
        </ul>
    );
}

/** `DaySwitcher`: its caption and arrows — 44px tall on a phone, where the
    arrows are finger-sized — over the strip of 48px day tiles. */
export function DaySwitcherSkeleton() {
    return (
        <div>
            <div className="flex h-11 items-center justify-between gap-3 md:h-8.5">
                <Bar className={`w-24 ${eyebrowLine}`} />
                <Bar className="mr-2.5 h-4 w-14" />
            </div>
            <div className="flex gap-2 py-1.5">
                {[0, 1, 2].map((i) => (
                    <Bar
                        key={i}
                        className="size-12 shrink-0 rounded-md"
                    />
                ))}
            </div>
        </div>
    );
}
