'use client';

import { useT } from '@/i18n/use-t';
import { iconButtonClass } from '@/lib/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { useEditMode } from './edit-mode';

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
 */
export function DaySwitcher({
    days,
    index,
    baseId,
    onSelect,
}: {
    days: DayTab[];
    index: number;
    /** Prefix for the tab/panel id pair, so both sides agree on the wiring. */
    baseId: string;
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
        <div>
            <div className="flex items-center justify-between gap-3">
                <h2
                    id={`${baseId}-label`}
                    className="eyebrow text-muted"
                >
                    {t('routine.workouts')}
                </h2>
                <div className="flex items-center">
                    <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => select(index - 1)}
                        aria-label={t('routine.prevDay')}
                        className={`${iconButtonClass} disabled:pointer-events-none disabled:opacity-30`}
                    >
                        <ChevronLeft
                            size={18}
                            aria-hidden
                        />
                    </button>
                    <button
                        type="button"
                        disabled={index === last}
                        onClick={() => select(index + 1)}
                        aria-label={t('routine.nextDay')}
                        className={`${iconButtonClass} disabled:pointer-events-none disabled:opacity-30`}
                    >
                        <ChevronRight
                            size={18}
                            aria-hidden
                        />
                    </button>
                </div>
            </div>

            <div
                ref={listRef}
                role="tablist"
                aria-labelledby={`${baseId}-label`}
                onKeyDown={(event) => {
                    if (event.key === 'ArrowRight') move(index + 1);
                    else if (event.key === 'ArrowLeft') move(index - 1);
                    else if (event.key === 'Home') move(0);
                    else if (event.key === 'End') move(last);
                    else return;
                    event.preventDefault();
                }}
                className="-mx-1.5 flex gap-2 overflow-x-auto px-1.5 py-1.5"
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
                                    className={`mt-1 block h-[3px] rounded-xs ${
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
        </div>
    );
}
