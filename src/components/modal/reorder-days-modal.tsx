'use client';

import { useT } from '@/i18n/use-t';
import { ghostClass, primaryClass } from '@/lib/ui';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { swap } from '@/lib/swap';
import { ActionButton } from '@/components/ui/action-button';
import { Modal } from '@/components/modal/modal';

export type ReorderDaysModalProps = {
    days: { id: string; name: string }[];
    /** Every day's id, in the order to keep. */
    onSave: (ids: string[]) => Promise<void>;
    onClose: () => void;
};

/** The exercise card's move arrows, hover and all. The rows carry no fill of
    their own: the hover's is the same surface, and would vanish on it. One
    size at every width, unlike `iconButtonClass`, which shrinks from md up:
    the arrows set the row's height, and the rows stay the same height. */
const moveClass =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted ' +
    'transition-colors hover:bg-surface2 hover:text-pulse ' +
    'disabled:pointer-events-none disabled:opacity-30';

/**
 * The routine's days as a list to put in order: each one moves up or down a
 * place, and nothing is stored until Save. Closing it any other way leaves the
 * days as they were.
 *
 * After a move the focus goes with the day that moved, onto its other arrow
 * once it has reached the end of the list — the rows are keyed by day, but the
 * arrow pressed may have just gone dead.
 */
export function ReorderDaysModal({
    days,
    onSave,
    onClose,
}: ReorderDaysModalProps) {
    const t = useT();
    const [order, setOrder] = useState(days);
    const list = useRef<HTMLOListElement>(null);
    const changed = order.some((day, i) => day.id !== days[i].id);

    /** The rows slide to their new places (`swap`): each carries its day's
        name, so the browser knows which is which before and after. */
    function move(from: number, step: -1 | 1) {
        const to = from + step;
        swap(() => {
            flushSync(() =>
                setOrder((current) => {
                    const next = [...current];
                    next.splice(to, 0, ...next.splice(from, 1));
                    return next;
                })
            );
            const row = list.current?.children[to];
            const arrows = step < 0 ? ['up', 'down'] : ['down', 'up'];
            arrows
                .map((arrow) =>
                    row?.querySelector<HTMLButtonElement>(
                        `[data-move="${arrow}"]`
                    )
                )
                .find((button) => button && !button.disabled)
                ?.focus({ preventScroll: true });
        });
    }

    return (
        <Modal
            title={t('routine.reorderDays')}
            onClose={onClose}
        >
            <ol
                ref={list}
                className="space-y-2"
            >
                {order.map((day, position) => {
                    const was = days.findIndex(({ id }) => id === day.id);
                    const moved = was !== position;
                    return (
                        <li
                            key={day.id}
                            style={{
                                viewTransitionName: `day-${day.id}`,
                                viewTransitionClass: 'swap',
                            }}
                            className="border-line bg-surface flex items-center gap-3 rounded-md border-2 p-1.5"
                        >
                            <span
                                aria-hidden
                                className={`figure grid h-9 w-9 shrink-0 place-items-center rounded-md border-2 text-lg leading-none transition-colors ${
                                    moved
                                        ? 'border-draft text-draft'
                                        : 'border-line text-muted'
                                }`}
                            >
                                {position + 1}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="display text-ink block truncate text-xl">
                                    {day.name}
                                </span>
                                {moved && (
                                    <span className="eyebrow text-muted mt-1 block">
                                        {t('routine.wasDay', { n: was + 1 })}
                                    </span>
                                )}
                            </span>
                            <button
                                type="button"
                                data-move="up"
                                disabled={position === 0}
                                onClick={() => move(position, -1)}
                                aria-label={t('routine.moveDayUp', {
                                    name: day.name,
                                })}
                                className={moveClass}
                            >
                                <ArrowUp
                                    size={16}
                                    aria-hidden
                                />
                            </button>
                            <button
                                type="button"
                                data-move="down"
                                disabled={position === order.length - 1}
                                onClick={() => move(position, 1)}
                                aria-label={t('routine.moveDayDown', {
                                    name: day.name,
                                })}
                                className={moveClass}
                            >
                                <ArrowDown
                                    size={16}
                                    aria-hidden
                                />
                            </button>
                        </li>
                    );
                })}
            </ol>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={onClose}
                    className={ghostClass}
                >
                    {t('common.cancel')}
                </button>
                <ActionButton
                    action={async () => {
                        await onSave(order.map((day) => day.id));
                        onClose();
                    }}
                    disabled={!changed}
                    success={t('toast.daysReordered')}
                    className={`${primaryClass} py-2.5 text-sm`}
                >
                    {t('common.save')}
                </ActionButton>
            </div>
        </Modal>
    );
}
