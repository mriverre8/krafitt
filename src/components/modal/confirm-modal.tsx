'use client';

import { useT } from '@/i18n/use-t';
import { dangerClass, ghostClass } from '@/lib/ui';
import { Modal } from '@/components/modal/modal';

export type ConfirmModalProps = {
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onClose: () => void;
};

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
