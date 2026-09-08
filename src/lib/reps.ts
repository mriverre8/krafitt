import type { Translate } from '@/i18n/config';

/**
 * A set prescribes its reps in one of three ways, encoded in two columns so no
 * extra mode field can drift out of sync with them:
 * both null is AMRAP, equal values are a fixed number, the rest is a range.
 */
export type RepSpec = { repMin: number | null; repMax: number | null };

export const REP_MODES = ['range', 'fixed', 'amrap'] as const;
export type RepMode = (typeof REP_MODES)[number];

export function isRepMode(value: unknown): value is RepMode {
    return REP_MODES.includes(value as RepMode);
}

export function repMode({ repMin, repMax }: RepSpec): RepMode {
    if (repMin === null || repMax === null) return 'amrap';
    return repMin === repMax ? 'fixed' : 'range';
}

export function formatReps(set: RepSpec, t: Translate): string {
    switch (repMode(set)) {
        case 'amrap':
            return t('reps.amrap');
        case 'fixed':
            return t('today.setPlanFixed', { reps: set.repMin! });
        default:
            return t('today.setPlan', { min: set.repMin!, max: set.repMax! });
    }
}
