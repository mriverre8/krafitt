'use client';

import { useT } from '@/i18n/use-t';
import { ArrowDown, ArrowUp, SquarePlus, Trash } from 'lucide-react';

/** A button of the card's foot. The colours are left to each — the accent to
    add a set, muted for the rest — since two text- utilities on one element
    come down to the order Tailwind emits them in. */
const footButtonClass =
    'eyebrow flex min-h-10 md:min-h-9 shrink-0 items-center gap-1 rounded-md px-1 whitespace-nowrap md:px-1.5 ' +
    'transition-colors hover:bg-surface2 disabled:pointer-events-none disabled:opacity-30';
const quietFootClass =
    'min-w-10 md:min-w-9 justify-center text-muted hover:text-pulse';
/** Where the foot is too narrow for four labels — a 360px phone, or a
    language with longer words — the three that carry an icon of their own keep
    just the icon. Their aria-labels say the rest. */
const quietLabelClass = '@max-[19rem]:sr-only';

/**
 * The foot of an exercise's card: add a set, move the card up or down the
 * day, or delete it. The arrows carry `data-move`, which the editor uses to
 * hand the focus to the card once it has moved.
 */
export function ExerciseFoot({
    exerciseNumber,
    nextSet,
    full,
    onAddSet,
    isFirst,
    isLast,
    onMove,
    canRemove,
    onRemove,
}: {
    exerciseNumber: number;
    /** The name the set Add would make gets. */
    nextSet: number;
    full: boolean;
    onAddSet: () => void;
    isFirst: boolean;
    isLast: boolean;
    onMove: (step: -1 | 1) => void;
    canRemove: boolean;
    onRemove: () => void;
}) {
    const t = useT();
    return (
        <div className="border-line @container mt-4 flex flex-wrap items-center gap-1 border-t pt-2 md:mt-5 md:pt-3">
            <button
                type="button"
                disabled={full}
                onClick={onAddSet}
                aria-label={t('exercise.addSetLabel', {
                    n: nextSet,
                    exercise: exerciseNumber,
                })}
                className={`${footButtonClass} text-pulse hover:text-pulse/70 flex-1 justify-start`}
            >
                <SquarePlus
                    size={14}
                    aria-hidden
                />
                {t('exercise.addSet', { n: nextSet })}
            </button>
            <div className="ml-auto flex gap-0.5 md:gap-1">
                <button
                    type="button"
                    data-move="up"
                    disabled={isFirst}
                    onClick={() => onMove(-1)}
                    aria-label={t('exercise.moveUp', {
                        exercise: exerciseNumber,
                    })}
                    className={`${footButtonClass} ${quietFootClass}`}
                >
                    <ArrowUp
                        size={14}
                        aria-hidden
                    />
                    <span className={quietLabelClass}>
                        {t('exercise.moveUpShort')}
                    </span>
                </button>
                <button
                    type="button"
                    data-move="down"
                    disabled={isLast}
                    onClick={() => onMove(1)}
                    aria-label={t('exercise.moveDown', {
                        exercise: exerciseNumber,
                    })}
                    className={`${footButtonClass} ${quietFootClass}`}
                >
                    <ArrowDown
                        size={14}
                        aria-hidden
                    />
                    <span className={quietLabelClass}>
                        {t('exercise.moveDownShort')}
                    </span>
                </button>
                <button
                    type="button"
                    disabled={!canRemove}
                    onClick={onRemove}
                    aria-label={t('exercise.delete', {
                        exercise: exerciseNumber,
                    })}
                    className={`${footButtonClass} text-muted hover:text-danger min-w-10 justify-center md:min-w-9`}
                >
                    <Trash
                        size={14}
                        aria-hidden
                    />
                    <span className={quietLabelClass}>
                        {t('exercise.removeShort')}
                    </span>
                </button>
            </div>
        </div>
    );
}
