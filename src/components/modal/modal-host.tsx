'use client';

import { modals } from '@/lib/modal-registry';
import { useModalStore } from '@/store/modal';
import type { ComponentType } from 'react';

/**
 * Mounted once in the layout. Renders whichever modal the store says is open
 * and hands it the onClose that clears it, so rendered is the same thing as
 * open. The registry of modals it picks from is `lib/modal-registry.ts`.
 */
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
