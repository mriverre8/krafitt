import type { Translate } from '@/i18n/config';
import { REPS } from './constants';

/**
 * A set prescribes its reps in one of three ways. The mode is stored next to the
 * two columns rather than derived from them: a routine can now be saved
 * half-written, and a blank repMin/repMax has to mean "not filled in yet"
 * instead of quietly reading as AMRAP.
 */
export type RepSpec = {
    repMode: string;
    repMin: number | null;
    repMax: number | null;
};

export const REP_MODES = ['range', 'fixed', 'amrap'] as const;
export type RepMode = (typeof REP_MODES)[number];

export function isRepMode(value: unknown): value is RepMode {
    return REP_MODES.includes(value as RepMode);
}

const inRange = (value: number | null) =>
    value !== null &&
    Number.isInteger(value) &&
    value >= REPS.min &&
    value <= REPS.max;

/**
 * Which of the two rep fields this mode still needs sorting out. The editor
 * paints exactly these red, so the check lives here rather than being restated
 * as a boolean in one place and a highlight in another.
 */
export function badRepFields({ repMode, repMin, repMax }: RepSpec): {
    min: boolean;
    max: boolean;
} {
    if (repMode === 'amrap') return { min: false, max: false };
    const min = !inRange(repMin);
    if (repMode === 'fixed') return { min, max: false };
    // A range that starts and ends on the same number is not a range: that
    // prescription is what the fixed mode is for.
    return { min, max: !inRange(repMax) || (!min && repMax! <= repMin!) };
}

/** Everything this mode needs is filled in, and the numbers make sense. */
export function isSetComplete(set: RepSpec): boolean {
    const bad = badRepFields(set);
    return !bad.min && !bad.max;
}

export function formatReps(set: RepSpec, t: Translate): string {
    if (!isSetComplete(set)) return t('reps.unset');
    switch (set.repMode) {
        case 'amrap':
            return t('reps.amrap');
        case 'fixed':
            return t('today.setPlanFixed', { reps: set.repMin! });
        default:
            return t('today.setPlan', { min: set.repMin!, max: set.repMax! });
    }
}
