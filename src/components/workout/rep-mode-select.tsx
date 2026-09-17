'use client';

import { useT } from '@/i18n/use-t';
import { REP_MODES, type RepMode } from '@/lib/reps';
import { fieldClass, rowFieldClass } from '@/lib/ui';

/**
 * How a set prescribes its reps. First control on the row, because it decides
 * what the rest of the row asks for: two boxes for a range, one for a fixed
 * count, none at all for AMRAP or unspecified.
 */
export function RepModeSelect({
    exerciseNumber,
    setLabel,
    mode,
    onChange,
}: {
    /** The exercise's number in the day, and the set's name inside it. Labels
        carry both: a day holds several cards, and "Reps type set 1" on its own
        would name one control per card. */
    exerciseNumber: number;
    setLabel: string;
    mode: RepMode;
    onChange: (mode: RepMode) => void;
}) {
    const t = useT();
    return (
        <select
            value={mode}
            onChange={(event) => onChange(event.target.value as RepMode)}
            aria-label={t('exercise.repMode', {
                exercise: exerciseNumber,
                set: setLabel,
            })}
            className={`${fieldClass} ${rowFieldClass} w-24 shrink-0 px-2 md:w-28 md:px-3`}
        >
            {REP_MODES.map((value) => (
                <option
                    key={value}
                    value={value}
                >
                    {t(`reps.${value}`)}
                </option>
            ))}
        </select>
    );
}
