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

/** Everything this mode needs is filled in, and the numbers make sense. */
export function isSetComplete({ repMode, repMin, repMax }: RepSpec): boolean {
    if (repMode === 'amrap') return true;
    if (!inRange(repMin)) return false;
    if (repMode === 'fixed') return true;
    return inRange(repMax) && repMax! >= repMin!;
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
