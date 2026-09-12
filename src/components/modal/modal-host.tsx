'use client';

import { useModalStore } from '@/store/modal';
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

/**
 * Every modal in the app, in one place, mounted once in the layout.
 *
 * They arrive as their own chunks: a modal is by definition something most
 * visits never open, and none of them belong in the bundle that has to be
 * parsed before the first workout is on screen. dynamic() has to sit at the top
 * level of a module with a literal path — the bundler matches the chunk to the
 * call — so this registry is written out by hand rather than built in a loop.
 *
 * To add one: write the component as children of <Modal>, add a line here and a
 * key to ModalProps in the store. Nothing else in the app changes.
 */
const modals = {
    confirm: dynamic(() =>
        import('./confirm-modal').then((m) => m.ConfirmModal)
    ),
    settings: dynamic(() =>
        import('./settings-modal').then((m) => m.SettingsModal)
    ),
};

export function ModalHost() {
    const open = useModalStore((s) => s.open);
    const close = useModalStore((s) => s.close);

    if (!open) return null;

    // The kind and its props were paired at the point they were stored, and the
    // store's `show` is what type-checks that pairing. Here they are a union
    // and one cast is cheaper than teaching TypeScript the correlation again.
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
