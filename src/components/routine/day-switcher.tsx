'use client';

import { useT } from '@/i18n/use-t';
import type { FormAction } from '@/lib/forms';
import { dashedActionClass } from '@/lib/ui';
import { showModal } from '@/store/modal';
import { Plus } from 'lucide-react';
import { useRef } from 'react';
import { useEditMode } from '@/components/routine/edit-mode';

export type DayTab = {
    id: string;
    name: string;
    ready: boolean;
    /** Edited and not saved yet, so `ready` describes a day that no longer
        exists anywhere but the draft. */
    unsaved: boolean;
};

/**
 * The days of a routine as a rack of numbered plates: one is on screen at a
 * time and this is what moves between them.
 *
 * Two channels, deliberately kept apart so neither has to fight the other:
 * volt fills the plate you are on, and the rule underneath — drawn outside the
 * fill, always against the page — says whether that day is trainable yet, or
 * yellow while it is edited and unsaved. Colour is never the only carrier: the
 * state is in the tab's label too. Both appear only while editing; the rule is
 * a verdict on a draft, and reading a routine there is no draft to judge.
 *
 * Numbers only. The day's name is the heading right below, so printing it here
 * as well would say the same thing twice and make the rack too wide to scan.
 *
 * The rack is now the whole control. It used to carry a caption and a pair of
 * chevrons above it, and the form for a new day sat in a row of its own further
 * down — three more things on a screen that already had too many. The plates
 * were always the faster way between days, the arrow keys still move the
 * selection, and a new day belongs at the end of the rack it will appear in.
 */
export function DaySwitcher({
    days,
    index,
    baseId,
    addDay,
    onSelect,
}: {
    days: DayTab[];
    index: number;
    /** Prefix for the tab/panel id pair, so both sides agree on the wiring. */
    baseId: string;
    /** Already bound to its routine, so the dialog it opens sends nothing but a
        name. Left out on a routine that can no longer take days. */
    addDay?: FormAction;
    onSelect: (index: number) => void;
}) {
    const t = useT();
    const editing = useEditMode();
    const listRef = useRef<HTMLDivElement>(null);
    const last = days.length - 1;

    function tabAt(position: number) {
        return listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]')[
            position
        ];
    }

    function select(next: number) {
        if (next < 0 || next > last) return;
        onSelect(next);
        // A long routine scrolls its rack; the plate you just landed on has to
        // be one of the ones you can see.
        tabAt(next)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    /** Keyboard moves the selection and takes focus with it: the tabs carry a
        roving tabindex, so the one left behind is no longer a tab stop. */
    function move(next: number) {
        if (next < 0 || next > last) return;
        select(next);
        tabAt(next)?.focus();
    }

    return (
        <div className="-mx-1.5 flex items-start gap-2 overflow-x-auto px-1.5 py-1.5">
            <div
                ref={listRef}
                role="tablist"
                aria-label={t('routine.workouts')}
                onKeyDown={(event) => {
                    if (event.key === 'ArrowRight') move(index + 1);
                    else if (event.key === 'ArrowLeft') move(index - 1);
                    else if (event.key === 'Home') move(0);
                    else if (event.key === 'End') move(last);
                    else return;
                    event.preventDefault();
                }}
                className="flex gap-2"
            >
                {days.map((day, position) => {
                    const selected = position === index;
                    return (
                        <button
                            key={day.id}
                            type="button"
                            role="tab"
                            id={`${baseId}-tab-${position}`}
                            aria-controls={`${baseId}-panel-${position}`}
                            aria-selected={selected}
                            tabIndex={selected ? 0 : -1}
                            onClick={() => select(position)}
                            aria-label={
                                t('routine.dayTab', {
                                    n: position + 1,
                                    name: day.name,
                                }) +
                                (!editing
                                    ? ''
                                    : day.unsaved
                                      ? `, ${t('routine.unsaved')}`
                                      : day.ready
                                        ? ''
                                        : `, ${t('routines.incomplete')}`)
                            }
                            title={day.name}
                            className="lift group shrink-0 rounded-md"
                        >
                            <span
                                aria-hidden
                                className={`figure grid h-12 w-12 place-items-center rounded-md border-2 text-2xl leading-none ${
                                    selected
                                        ? 'bg-volt border-volt text-on-volt'
                                        : 'bg-surface border-line text-muted group-hover:border-pulse group-hover:text-pulse'
                                }`}
                            >
                                {position + 1}
                            </span>
                            {editing && (
                                <span
                                    aria-hidden
                                    className={`mt-1 block h-0.75 rounded-xs ${
                                        day.unsaved
                                            ? 'bg-draft'
                                            : day.ready
                                              ? 'bg-surge'
                                              : 'bg-danger'
                                    }`}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {editing && addDay && (
                <button
                    type="button"
                    onClick={() =>
                        showModal('rename', {
                            name: '',
                            rename: addDay,
                            title: t('routine.addDayTitle'),
                            label: t('routine.dayLabel'),
                            placeholder: t('routine.dayPlaceholder'),
                            confirmLabel: t('common.add'),
                        })
                    }
                    aria-label={t('routine.addDayTitle')}
                    className={`${dashedActionClass} h-12 w-12 shrink-0`}
                >
                    <Plus
                        size={18}
                        aria-hidden
                    />
                </button>
            )}
        </div>
    );
}
