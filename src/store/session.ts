"use client";

import type { Logs, SetValue } from "@/lib/progress";
import { create } from "zustand";

type SessionStore = {
  sessionId: string | null;
  logs: Logs;
  /** Loads what the server sent when opening or starting a workout. */
  hydrate: (sessionId: string | null, logs: Logs) => void;
  /** Marks a set as logged (optimistic: the server action already stored it). */
  save: (exerciseId: string, setIndex: number, value: SetValue) => void;
};

export const useSessionStore = create<SessionStore>((set) => ({
  sessionId: null,
  logs: {},
  hydrate: (sessionId, logs) => set({ sessionId, logs }),
  save: (exerciseId, setIndex, value) =>
    set((s) => ({
      logs: { ...s.logs, [exerciseId]: { ...s.logs[exerciseId], [setIndex]: value } },
    })),
}));
