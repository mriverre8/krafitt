'use client';

import { showModal } from '@/store/modal';
import { useTransition } from 'react';

/** Button that fires a server action already bound to its arguments. */
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
    /** Asks in a modal first. Both of these guard a delete, so the modal's
        committing button is left at its default. */
    confirm?: { title: string; message: string };
    /** Accessible name for buttons whose content is only an icon. */
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
