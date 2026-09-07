'use client';

import { iconButtonClass } from '@/lib/ui';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Click-to-open menu. Closes on outside click and on Escape, which is the part
 * a plain <details> does not give us. Children get the close callback so an
 * item can dismiss the menu after acting on it.
 */
export function Dropdown({
    label,
    icon,
    children,
}: {
    label: string;
    icon: ReactNode;
    children: (close: () => void) => ReactNode;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        function onMouseDown(event: MouseEvent) {
            if (!ref.current?.contains(event.target as Node)) setOpen(false);
        }
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpen(false);
        }

        document.addEventListener('mousedown', onMouseDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    return (
        <div
            ref={ref}
            className="relative"
        >
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-label={label}
                aria-expanded={open}
                className={iconButtonClass}
            >
                {icon}
            </button>

            {open && (
                <div
                    aria-label={label}
                    className="border-line bg-surface absolute top-full right-0 z-50 mt-2 flex w-56 flex-col gap-1 rounded-xl border p-2 shadow-lg"
                >
                    {children(() => setOpen(false))}
                </div>
            )}
        </div>
    );
}
