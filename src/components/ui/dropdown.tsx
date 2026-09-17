'use client';

import { iconButtonClass } from '@/lib/ui';
import { useEffect, useRef, useState, type ReactNode } from 'react';

export function Dropdown({
    label,
    icon,
    className,
    align = 'right',
    children,
}: {
    label: string;
    icon: ReactNode;
    className?: string;
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
                    className={`border-line bg-surface absolute top-full z-15 mt-2 flex w-56 flex-col gap-1 rounded-md border-2 p-2 shadow-2xl ${
                        align === 'left' ? 'left-0' : 'right-0'
                    }`}
                >
                    {children(() => setOpen(false))}
                </div>
            )}
        </div>
    );
}
