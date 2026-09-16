'use client';

import { Dropdown } from '@/components/ui/dropdown';
import { useT } from '@/i18n/use-t';
import { USER_NAME_MAX } from '@/lib/constants';
import {
    dashedActionClass,
    fieldClass,
    menuItemClass,
    rowFieldClass,
    wrongFieldClass,
} from '@/lib/ui';
import { Plus, Type, X } from 'lucide-react';

/** The techniques the menu offers before Custom, in the order it offers them:
    a warm-up opens the exercise, so it opens the list too. */
const TECHNIQUES = ['warmup', 'linear', 'topset', 'backoff'] as const;

/** The column the working set gives its technique. It takes the line under the
    reps on a phone and the rest of the line beside them from md up, and it is
    there whether the set has a technique or not — an empty slot you can see is
    what tells you the set can have one at all. */
const techniqueSlotClass =
    'relative mt-1.5 min-w-40 basis-full md:mt-0 md:min-w-0 md:flex-1 md:basis-auto';

/**
 * The working set's technique, in the one slot it always occupies. Three
 * states, and the row keeps its shape through all of them:
 *
 * - nothing yet — a dashed field that says so, the way the drop's per cent
 *   does, and pressing it opens the list;
 * - one off the list — the field says which, and pressing it opens the same
 *   list again, so swapping is picking afresh rather than clearing first;
 * - written by hand — a field to type in, with an × inside that hands the set
 *   back to the first state.
 *
 * Which of the last two you are in is read off the value itself: anything the
 * list could have written is shown, anything else is typed. That is why Custom
 * sets it blank rather than to some marker — blank is a name the list does not
 * offer, and the routine already calls a blank one a hole.
 */
export function TechniqueField({
    e,
    n,
    technique,
    wrong,
    onChange,
}: {
    /** The exercise's number in the day, and the set's name inside it. */
    e: number;
    n: string;
    /** Null until the set is given one. Blank is a technique that was added and
        has yet to be named, which is a hole rather than none. */
    technique: string | null;
    /** Paint it red. Comes from the day's own errors. */
    wrong: boolean;
    onChange: (technique: string | null) => void;
}) {
    const t = useT();
    // What the menu offers. A set showing one of these was picked rather than
    // typed, so its field is read-only: Custom is the way to write your own.
    const presets: string[] = TECHNIQUES.map((key) => t(`technique.${key}`));
    const written = technique !== null && !presets.includes(technique);

    if (written)
        return (
            <div className={techniqueSlotClass}>
                <input
                    value={technique}
                    onChange={(event) => onChange(event.target.value)}
                    maxLength={USER_NAME_MAX}
                    placeholder={t('exercise.techniquePlaceholder')}
                    aria-label={t('exercise.technique', { e, n })}
                    className={`${
                        wrong ? wrongFieldClass : fieldClass
                    } ${rowFieldClass} w-full pr-12`}
                />
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    aria-label={t('exercise.removeTechniqueLabel', { e, n })}
                    className="text-muted hover:text-danger absolute top-1/2 right-0.5 flex min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-md transition-colors md:min-h-9 md:min-w-9"
                >
                    <X
                        size={14}
                        aria-hidden
                    />
                </button>
            </div>
        );

    return (
        <div className={techniqueSlotClass}>
            <Dropdown
                label={t('exercise.techniqueMenu', { e, n })}
                align="right"
                className={
                    technique === null
                        ? `${dashedActionClass} ${rowFieldClass} w-full px-3`
                        : `${wrong ? wrongFieldClass : fieldClass} ${rowFieldClass} flex w-full items-center`
                }
                icon={
                    technique === null ? (
                        <>
                            <Plus
                                size={14}
                                aria-hidden
                            />
                            {t('exercise.noTechnique')}
                        </>
                    ) : (
                        technique
                    )
                }
            >
                {(close) => (
                    <>
                        {presets.map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                    onChange(preset);
                                    close();
                                }}
                                className={menuItemClass}
                            >
                                {preset}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => {
                                onChange('');
                                close();
                            }}
                            className={menuItemClass}
                        >
                            <Type
                                size={14}
                                aria-hidden
                            />
                            {t('technique.custom')}
                        </button>
                        {technique !== null && (
                            <button
                                type="button"
                                onClick={() => {
                                    onChange(null);
                                    close();
                                }}
                                aria-label={t('exercise.removeTechniqueLabel', {
                                    e,
                                    n,
                                })}
                                className={menuItemClass}
                            >
                                {t('exercise.unspecified')}
                            </button>
                        )}
                    </>
                )}
            </Dropdown>
        </div>
    );
}
