'use client';

import type { Logs, SetValue } from '@/lib/progress';
import { create } from 'zustand';

type SessionStore = {
    logs: Logs;
    /** Which day the logs belong to: the workout and the week, because a routine
        with one day in it comes round again under the same workout id. */
    day?: string;
    /** Loads what the server sent for a day the store is not already holding.
        A day it is holding is left alone: every save reaches the server before
        it reaches the store, so the store is never the stale copy — the payload
        can be. Going back to this page replays the one it was rendered with,
        from before a set was logged, and re-seeding from it would empty the
        fields the user just filled. */
    hydrate: (day: string, logs: Logs) => void;
    /** Marks a set as logged (optimistic: the server action already stored it). */
    save: (exerciseId: string, setIndex: number, value: SetValue) => void;
};

export const useSessionStore = create<SessionStore>((set) => ({
    logs: {},
    hydrate: (day, logs) => set((s) => (s.day === day ? s : { day, logs })),
    save: (exerciseId, setIndex, value) =>
        set((s) => ({
            logs: {
                ...s.logs,
                [exerciseId]: { ...s.logs[exerciseId], [setIndex]: value },
            },
        })),
}));
