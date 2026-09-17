'use client';

import { useT } from '@/i18n/use-t';
import type { FormAction } from '@/lib/forms';
import { dashedActionClass, iconButtonClass } from '@/lib/ui';
import { showModal } from '@/store/modal';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useRef } from 'react';
import { useEditMode } from '@/components/routine/edit-mode';

export type DayTab = {
    id: string;
    name: string;
    ready: boolean;
    unsaved: boolean;
};

export function DaySwitcher({
    days,
    index,
    baseId,
    addDay,
    onSelect,
}: {
    days: DayTab[];
    index: number;
    baseId: string;
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
        tabAt(next)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

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

            <div className="-mx-1.5 flex items-start gap-2 overflow-x-auto px-1.5 py-1.5">
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
                    className="flex shrink-0 gap-2"
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
        </div>
    );
}
