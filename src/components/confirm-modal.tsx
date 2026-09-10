'use client';

import { useT } from '@/i18n/use-t';
import { dangerClass, ghostClass } from '@/lib/ui';
import { Modal } from './modal';

export type ConfirmModalProps = {
    title: string;
    message: string;
    /** Defaults to Delete: that is what most of these guard. */
    confirmLabel?: string;
    onConfirm: () => void;
    /** Supplied by the ModalHost. */
    onClose: () => void;
};

/**
 * The first thing built as children of <Modal>, and the one that replaced
 * window.confirm everywhere.
 *
 * Every confirm this app asks for guards something that does not come back — a
 * deleted routine, a deleted day, a discarded draft, a skipped day — so the
 * committing button is always the danger fill and always names the move, never
 * "OK". Cancel is the ghost next to it and the one the dialog opens on.
 */
export function ConfirmModal({
    title,
    message,
    confirmLabel,
    onConfirm,
    onClose,
}: ConfirmModalProps) {
    const t = useT();

    return (
        <Modal
            title={title}
            onClose={onClose}
        >
            <p className="text-muted text-base">{message}</p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className={ghostClass}
                >
                    {t('common.cancel')}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        onClose();
                        onConfirm();
                    }}
                    className={dangerClass}
                >
                    {confirmLabel ?? t('common.delete')}
                </button>
            </div>
        </Modal>
    );
}
