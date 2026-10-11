'use client';

import type { ConfirmModalProps } from '@/components/modal/confirm-modal';
import { useT } from '@/i18n/use-t';
import { showModal } from '@/store/modal';
import { toast } from '@/store/toast';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { unstable_rethrow } from 'next/navigation';
import { useTransition } from 'react';

export function ActionButton({
    action,
    children,
    className = 'text-sm font-semibold text-muted transition-colors hover:text-pulse',
    confirm,
    label,
    success,
}: {
    action: () => Promise<unknown>;
    children: React.ReactNode;
    className?: string;
    confirm?: Omit<ConfirmModalProps, 'onConfirm' | 'onClose'>;
    label?: string;
    /** Said once the action is done, for actions nothing on screen confirms. */
    success?: string;
}) {
    const t = useT();
    const [pending, startTransition] = useTransition();

    function run() {
        startTransition(async () => {
            try {
                const result = await action();
                const error = (result as { error?: string } | undefined)?.error;
                if (error) toast(error, 'error');
                else if (success) toast(success);
            } catch (cause) {
                if (success && isRedirectError(cause)) toast(success);
                unstable_rethrow(cause);
                toast(t('today.genericError'), 'error');
            }
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
