'use client';

import { create } from 'zustand';

/**
 * Short messages about something that just happened, for the times the screen
 * itself says nothing: an action that failed, or one that worked without
 * anything visible moving. Validation stays next to its field — a toast is
 * gone before the user has fixed what it was about.
 *
 * A store for the same reason as the modal one: whatever raises a toast should
 * not have to host it.
 *
 * Nothing here keeps time. The host's timer bar does: it runs for `TOAST_MS`,
 * pauses while it is pointed at, and dismisses the toast when it runs out.
 * `dismiss` only starts the way out; `remove` is the host saying it is gone.
 */
export type Toast = {
    id: number;
    message: string;
    kind: 'success' | 'error';
    leaving?: true;
};

type ToastStore = {
    toasts: Toast[];
    dismiss: (id: number) => void;
    remove: (id: number) => void;
};

/** An error says what went wrong and has more to read. */
export const TOAST_MS = { success: 4000, error: 6500 };

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    dismiss: (id) =>
        set((s) => ({
            toasts: s.toasts.map((item) =>
                item.id === id ? { ...item, leaving: true } : item
            ),
        })),
    remove: (id) =>
        set((s) => ({ toasts: s.toasts.filter((item) => item.id !== id) })),
}));

let nextId = 0;

/** Raising one from anywhere, an event handler or an action's answer alike. */
export function toast(message: string, kind: Toast['kind'] = 'success') {
    const id = ++nextId;
    useToastStore.setState((s) => ({
        toasts: [...s.toasts, { id, message, kind }],
    }));
}
