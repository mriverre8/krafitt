'use client';

import { Dropdown } from '@/components/ui/dropdown';
import { useT } from '@/i18n/use-t';
import { SUB_KINDS, type SubKind } from '@/lib/sets';
import { menuDangerClass, menuItemClass } from '@/lib/ui';
import { Ellipsis, Plus, X } from 'lucide-react';

/** A dead menu row still has to look dead: `menuItemClass` and `menuDangerClass`
    both end in a hover colour, and a hover left live on a disabled row is the
    one thing that makes it look alive. */
const offClass = 'disabled:pointer-events-none disabled:opacity-40';

/**
 * What to do with a working set itself, behind the one ⋯ at the head of its
 * row: hang a drop or rest-pause off it, or take it out. The technique used to
 * sit in here too and no longer does — it is a field on the row now, and a
 * field that opens its own menu.
 *
 * One working set takes one kind of sub or the other, never both: once it has
 * one, `kind` says which, and the menu offers only more of that.
 */
export function SetMenu({
    e,
    n,
    kind,
    full,
    canRemove,
    onAdd,
    onRemove,
}: {
    /** The exercise's number in the day, and the set's name inside it. */
    e: number;
    n: string;
    /** The sub kind this set already carries, or null while it has none. */
    kind: SubKind | null;
    /** The exercise is at its cap: nothing more can be hung off this set. */
    full: boolean;
    /** False when this set is the whole exercise — removing it would leave the
        card with nothing on it. */
    canRemove: boolean;
    onAdd: (kind: SubKind) => void;
    onRemove: () => void;
}) {
    const t = useT();
    return (
        <Dropdown
            label={t('exercise.setMenu', { e, n })}
            icon={
                <Ellipsis
                    size={18}
                    aria-hidden
                />
            }
        >
            {(close) => (
                <>
                    {(kind ? [kind] : SUB_KINDS).map((option) => (
                        <button
                            key={option}
                            type="button"
                            disabled={full}
                            onClick={() => {
                                onAdd(option);
                                close();
                            }}
                            className={`${menuItemClass} ${offClass}`}
                        >
                            <Plus
                                size={14}
                                aria-hidden
                            />
                            {t(
                                option === 'drop'
                                    ? 'exercise.addDrop'
                                    : 'exercise.addRest'
                            )}
                        </button>
                    ))}
                    <button
                        type="button"
                        disabled={!canRemove}
                        onClick={() => {
                            onRemove();
                            close();
                        }}
                        aria-label={t('exercise.removeSet', { e, n })}
                        className={`${menuDangerClass} ${offClass}`}
                    >
                        <X
                            size={14}
                            aria-hidden
                        />
                        {t('exercise.removeSetShort')}
                    </button>
                </>
            )}
        </Dropdown>
    );
}
