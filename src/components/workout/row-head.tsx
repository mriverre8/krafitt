'use client';

import type { ReactNode } from 'react';

/**
 * The head of a set row: what the row is, and the one mark that opens
 * everything it can be told to do. One short line, so the fields under it are
 * what the eye lands on.
 *
 * `sub` is a drop or rest-pause row. It hangs off the working set above it, and
 * says so by staying quieter than the set that carries it.
 */
export function RowHead({
    label,
    sub = false,
    children,
}: {
    label: string;
    sub?: boolean;
    /** The row's one control: a menu on a working set, a single × on a sub. */
    children: ReactNode;
}) {
    return (
        <div className="flex min-h-10 items-center gap-2">
            <p className={`eyebrow ${sub ? 'text-muted' : 'text-pulse'}`}>
                {label}
            </p>
            <span className="ml-auto">{children}</span>
        </div>
    );
}
