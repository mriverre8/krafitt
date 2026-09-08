'use client';

import type { Logs, SetValue } from '@/lib/progress';
import { create } from 'zustand';

type SessionStore = {
    logs: Logs;
    /** Loads what the server sent for the workout on screen. */
    hydrate: (logs: Logs) => void;
    /** Marks a set as logged (optimistic: the server action already stored it). */
    save: (exerciseId: string, setIndex: number, value: SetValue) => void;
};

export const useSessionStore = create<SessionStore>((set) => ({
    logs: {},
    hydrate: (logs) => set({ logs }),
    save: (exerciseId, setIndex, value) =>
        set((s) => ({
            logs: {
                ...s.logs,
                [exerciseId]: { ...s.logs[exerciseId], [setIndex]: value },
            },
        })),
}));
