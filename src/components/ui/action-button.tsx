'use client';

import { showModal } from '@/store/modal';
import { useTransition } from 'react';

export function ActionButton({
    action,
    children,
    className = 'text-sm font-semibold text-muted transition-colors hover:text-pulse',
    confirm,
    label,
}: {
    action: () => Promise<unknown>;
    children: React.ReactNode;
    className?: string;
    confirm?: { title: string; message: string };
    label?: string;
}) {
    const [pending, startTransition] = useTransition();

    function run() {
        startTransition(async () => {
            await action();
        });
    }

    return (
        <button
            type="button"
            disabled={pending}
            aria-label={label}
            title={label}
            className={`${className} disabled:opacity-40`}
            onClick={() =>
                confirm
                    ? showModal('confirm', { ...confirm, onConfirm: run })
                    : run()
            }
        >
            {children}
        </button>
    );
}
