'use client';

import { useModalStore } from '@/store/modal';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

const modals = {
    confirm: dynamic(() =>
        import('./confirm-modal').then((m) => m.ConfirmModal)
    ),
    rename: dynamic(() =>
        import('./rename-routine-modal').then((m) => m.RenameRoutineModal)
    ),
    settings: dynamic(() =>
        import('./settings-modal').then((m) => m.SettingsModal)
    ),
};

export function ModalHost() {
    const open = useModalStore((s) => s.open);
    const close = useModalStore((s) => s.close);

    if (!open) return null;

    const Modal = modals[open.kind] as ComponentType<
        typeof open.props & { onClose: () => void }
    >;

    return (
        <Modal
            {...open.props}
            onClose={close}
        />
    );
}
