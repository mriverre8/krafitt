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
    className,
    align = 'right',
    children,
}: {
    label: string;
    icon: ReactNode;
    /** The trigger's own styling, for a menu that has to sit in a row of small
        text buttons rather than in the bar. Defaults to the icon button. */
    className?: string;
    /** Which edge the panel hangs from. A trigger over on the left needs the
        left one, or the panel opens off the side of whatever holds it. */
    align?: 'left' | 'right';
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
                className={className ?? iconButtonClass}
            >
                {icon}
            </button>

            {open && (
                <div
                    aria-label={label}
                    className={`border-line bg-surface absolute top-full z-50 mt-2 flex w-56 flex-col gap-1 rounded-md border-2 p-2 shadow-2xl ${
                        align === 'left' ? 'left-0' : 'right-0'
                    }`}
                >
                    {children(() => setOpen(false))}
                </div>
            )}
        </div>
    );
}
