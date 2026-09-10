'use client';

import type { ConfirmModalProps } from '@/components/confirm-modal';
import { create } from 'zustand';

/**
 * One modal is open at a time, and this is what says which. A store rather than
 * state in each component: what opens a modal is scattered all over the app —
 * a row action, a toggle, a skip button — and none of them should have to host
 * a dialog in their own tree to ask a question.
 *
 * Every modal the app can open is a key here, and its value is what it must be
 * opened with. `onClose` is deliberately not part of it: the host supplies it,
 * so nothing that opens a modal has to know how to close it.
 */
type ModalProps = {
    confirm: Omit<ConfirmModalProps, 'onClose'>;
};

type ModalKind = keyof ModalProps;

/** Kind and props travel together, so a set of props can never end up on the
    wrong modal. */
export type OpenModal = {
    [K in ModalKind]: { kind: K; props: ModalProps[K] };
}[ModalKind];

type ModalStore = {
    open: OpenModal | null;
    show: <K extends ModalKind>(kind: K, props: ModalProps[K]) => void;
    close: () => void;
};

export const useModalStore = create<ModalStore>((set) => ({
    open: null,
    show: (kind, props) => set({ open: { kind, props } as OpenModal }),
    close: () => set({ open: null }),
}));

/**
 * Opening a modal from an event handler. Read off the store once, at module
 * load, rather than through the hook: whoever opens a modal has no reason to
 * re-render when one opens, and most callers here are not even subscribed.
 */
export const showModal = useModalStore.getState().show;
export const closeModal = useModalStore.getState().close;
