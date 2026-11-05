'use client';

import type { ReactNode } from 'react';

/**
 * The head of a set row: what the row is, and the one mark that opens
 * everything it can be told to do. It doubles as the divider between rows — a
 * hairline runs from the name to the mark — so a set costs one short line of
 * structure instead of a head and a rule of its own. The mark keeps its
 * finger-sized target but hangs out of the line rather than setting its
 * height.
 *
 * `sub` is a drop or rest-pause row. It hangs off the working set above it, and
 * says so by staying quieter than the set that carries it: a muted name and a
 * dashed rule.
 */
export function RowHead({
    label,
    sub = false,
    beside,
    children,
}: {
    label: string;
    sub?: boolean;
    /** Right after the name: a working set's technique, which it either
        offers to add or names. */
    beside?: ReactNode;
    /** The row's one control: a menu on a working set, a single × on a sub. */
    children: ReactNode;
}) {
    return (
        <div className="flex items-center gap-3">
            <p
                className={`eyebrow shrink-0 ${sub ? 'text-muted' : 'text-pulse'}`}
            >
                {label}
            </p>
            {beside && <div className="-ml-1.5 min-w-0">{beside}</div>}
            <span
                aria-hidden
                className={`border-line flex-1 border-t ${sub ? 'border-dashed' : ''}`}
            />
            <span className="-my-3 ml-auto shrink-0 md:-my-2">{children}</span>
        </div>
    );
}
