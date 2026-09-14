'use client';

/**
 * The edit-mode context and the hooks that read it. A context rather than a
 * store, so it starts fresh on each routine you open instead of carrying the
 * last one's mode over.
 *
 * The provider that fills it in, and the components that react to it, are in
 * `components/routine/`.
 */

import { createContext, useContext, useEffect } from 'react';
import type { EditMode } from './types';

export const noDirtyDays: ReadonlySet<string> = new Set();

export const EditModeContext = createContext<EditMode>({
    editing: false,
    toggle: () => {},
    discarded: 0,
    dirtyDays: noDirtyDays,
    setDirty: () => {},
});

export function useEditMode() {
    return useContext(EditModeContext).editing;
}

/** Which days have been edited and not saved. */
export function useDirtyDays() {
    return useContext(EditModeContext).dirtyDays;
}

/** Whether the routine is being edited, and the toggle that flips it. */
export function useEditModeToggle() {
    const { editing, toggle } = useContext(EditModeContext);
    return { editing, toggle };
}

/**
 * Tells the routine whether this day is unsaved, and hands back the number that
 * rises when the drafts are to be thrown away.
 */
export function useDiscardSignal(id: string, isDirty: boolean) {
    const { discarded, setDirty } = useContext(EditModeContext);

    useEffect(() => {
        setDirty(id, isDirty);
        // A day that leaves the page — deleted, or the routine closed — takes
        // its unsaved state with it and must not stay on the list.
        return () => setDirty(id, false);
    }, [id, isDirty, setDirty]);

    return discarded;
}
