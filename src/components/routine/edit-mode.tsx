'use client';

import { useT } from '@/i18n/use-t';
import { showModal } from '@/store/modal';
import { BackButton } from '@/components/ui/back-button';
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

    function leaveEditing() {
        setDirtyDays(noDirtyDays);
        setDiscarded((n) => n + 1);
        setEditing(false);
    }

    function toggle() {
        if (!editing) return setEditing(true);
        if (dirtyDays.size > 0)
            return showModal('confirm', {
                title: t('routine.discardTitle'),
                message: t('routine.discardConfirm'),
                confirmLabel: t('routine.discard'),
                onConfirm: leaveEditing,
            });
        leaveEditing();
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

/** Its children step aside while editing. */
export function WhenNotEditing({ children }: { children: ReactNode }) {
    return useEditMode() ? null : children;
}

/** Its own colour rather than `labelClass`, which ends in a text-muted: two
    text- utilities on one element and the winner comes down to the order
    Tailwind emits them in, not the order they are written. */
const toggleClass =
    'eyebrow flex shrink-0 items-center gap-1.5 py-1 transition-colors';

/**
 * The routine's own Back. In edit mode there is somewhere nearer to come back
 * from than the last page, so it steps out of the mode and stays put — asking
 * first if any day is unsaved, the same question Done asks, since it throws
 * the same drafts away. Out of edit mode it is the ordinary Back.
 */
export function EditModeBackButton({ fallback }: { fallback: string }) {
    const { editing, toggle } = useContext(EditModeContext);
    return (
        <BackButton
            fallback={fallback}
            onBack={editing ? toggle : undefined}
        />
    );
}

/** Set like the delete link it shares a line with, so the two read as one pair
    of routine-level moves — pulse rather than danger: this one breaks nothing
    that was saved. On the way out it turns surge, the green everything else in
    the app finishes on, because by then it is the button that closes the edit.
    Given a className it is a row of the options menu instead. */
export function EditModeToggle({
    className,
    onClick,
}: {
    className?: string;
    /** Run after the toggle, for a menu that has to close behind it. */
    onClick?: () => void;
} = {}) {
    const t = useT();
    const { editing, toggle } = useContext(EditModeContext);
    const label = t(editing ? 'routine.doneEditing' : 'routine.edit');

    return (
        <button
            type="button"
            onClick={() => {
                toggle();
                onClick?.();
            }}
            aria-pressed={editing}
            className={
                className ??
                `${toggleClass} ${
                    editing
                        ? 'text-surge hover:text-surge/70'
                        : 'text-muted hover:text-pulse'
                }`
            }
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
