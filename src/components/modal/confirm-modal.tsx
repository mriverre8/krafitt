'use client';

import { useT } from '@/i18n/use-t';
import { dangerClass, ghostClass, primaryClass } from '@/lib/ui';
import { Modal } from '@/components/modal/modal';

export type ConfirmModalProps = {
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onClose: () => void;
};

export function ConfirmModal({
    title,
    message,
    confirmLabel,
    danger = true,
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
                    className={
                        danger ? dangerClass : `${primaryClass} py-2.5 text-sm`
                    }
                >
                    {confirmLabel ?? t('common.delete')}
                </button>
            </div>
        </Modal>
    );
}
