'use client';

import { useT } from '@/i18n/use-t';
import { labelClass } from '@/lib/ui';
import { Check, Pencil } from 'lucide-react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';

/**
 * A routine opens read-only: every field is locked and everything that changes
 * it is out of sight until Edit is pressed.
 *
 * A context rather than a store, so it starts fresh on each routine you open
 * instead of carrying the last one's mode over.
 *
 * Leaving edit mode throws the unsaved drafts away, so what is on screen in
 * read mode is what the database holds and nothing else. The days keep their
 * own drafts — the context only holds which ones are dirty, so the toggle knows
 * whether to ask first and the rack of days can mark them, and bumps
 * `discarded` to tell them all to start over.
 */
type EditMode = {
    editing: boolean;
    toggle: () => void;
    /** Rises by one each time the drafts are thrown away. */
    discarded: number;
    /** Days edited since their last save, by id. */
    dirtyDays: ReadonlySet<string>;
    /** Called by each day as its draft moves away from, or back to, the last
        save. */
    setDirty: (id: string, dirty: boolean) => void;
};

const noDirtyDays: ReadonlySet<string> = new Set();

export const EditModeContext = createContext<EditMode>({
    editing: false,
    toggle: () => {},
    discarded: 0,
    dirtyDays: noDirtyDays,
    setDirty: () => {},
});

export function EditModeProvider({ children }: { children: ReactNode }) {
    const t = useT();
    const [editing, setEditing] = useState(false);
    const [discarded, setDiscarded] = useState(0);
    const [dirtyDays, setDirtyDays] =
        useState<ReadonlySet<string>>(noDirtyDays);

    // Stable, so the days' effects fire on their own dirtiness and nothing else.
    // Handing back the same set when the answer has not changed is what stops a
    // day's own re-render from feeding straight back into its effect.
    const setDirty = useCallback((id: string, isDirty: boolean) => {
        setDirtyDays((current) => {
            if (current.has(id) === isDirty) return current;
            const next = new Set(current);
            if (isDirty) next.add(id);
            else next.delete(id);
            return next;
        });
    }, []);

    function toggle() {
        if (editing) {
            if (
                dirtyDays.size > 0 &&
                !window.confirm(t('routine.discardConfirm'))
            )
                return;
            setDirtyDays(noDirtyDays);
            setDiscarded((n) => n + 1);
        }
        setEditing((on) => !on);
    }

    return (
        <EditModeContext
            value={{ editing, toggle, discarded, dirtyDays, setDirty }}
        >
            {children}
        </EditModeContext>
    );
}

/** Which days have been edited and not saved. */
export function useDirtyDays() {
    return useContext(EditModeContext).dirtyDays;
}

export function useEditMode() {
    return useContext(EditModeContext).editing;
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

/** Its children exist only while editing. */
export function WhenEditing({ children }: { children: ReactNode }) {
    return useEditMode() ? children : null;
}

/** Set like the delete link it shares a line with, so the two read as one pair
    of routine-level moves — pulse rather than danger: this one breaks nothing
    that was saved. */
export function EditModeToggle() {
    const t = useT();
    const { editing, toggle } = useContext(EditModeContext);
    const label = t(editing ? 'routine.doneEditing' : 'routine.edit');

    return (
        <button
            type="button"
            onClick={toggle}
            aria-pressed={editing}
            className={`${labelClass} hover:text-pulse flex shrink-0 items-center gap-1.5 py-1 transition-colors`}
        >
            {editing ? (
                <Check
                    size={14}
                    aria-hidden
                />
            ) : (
                <Pencil
                    size={14}
                    aria-hidden
                />
            )}
            {label}
        </button>
    );
}
