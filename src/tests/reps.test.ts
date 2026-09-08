import { createT } from '@/i18n/config';
import { en } from '@/i18n/en';
import { formatReps, isRepMode, isSetComplete } from '@/lib/reps';
import { describe, expect, it } from 'vitest';

const t = createT(en);

describe('reps', () => {
    it('formats each prescription', () => {
        expect(formatReps({ repMode: 'range', repMin: 6, repMax: 8 }, t)).toBe(
            '6-8 reps'
        );
        expect(
            formatReps({ repMode: 'fixed', repMin: 8, repMax: null }, t)
        ).toBe('8 reps');
        expect(
            formatReps({ repMode: 'amrap', repMin: null, repMax: null }, t)
        ).toBe('AMRAP');
    });

    it('tells a blank set apart from an AMRAP one', () => {
        expect(
            isSetComplete({ repMode: 'amrap', repMin: null, repMax: null })
        ).toBe(true);
        expect(
            isSetComplete({ repMode: 'range', repMin: null, repMax: null })
        ).toBe(false);
        // Half filled in: a range still needs its top end.
        expect(
            isSetComplete({ repMode: 'range', repMin: 6, repMax: null })
        ).toBe(false);
        expect(
            isSetComplete({ repMode: 'fixed', repMin: 6, repMax: null })
        ).toBe(true);
        // Backwards, or outside the allowed counts.
        expect(isSetComplete({ repMode: 'range', repMin: 8, repMax: 6 })).toBe(
            false
        );
        // Same number at both ends: that is the fixed mode, not a range.
        expect(isSetComplete({ repMode: 'range', repMin: 8, repMax: 8 })).toBe(
            false
        );
        expect(isSetComplete({ repMode: 'fixed', repMin: 8, repMax: 8 })).toBe(
            true
        );
        expect(isSetComplete({ repMode: 'fixed', repMin: 0, repMax: 0 })).toBe(
            false
        );
    });

    it('says so when a set is still to be defined', () => {
        expect(
            formatReps({ repMode: 'range', repMin: null, repMax: null }, t)
        ).toBe('Reps to define');
    });

    it('only accepts the known modes', () => {
        expect(isRepMode('amrap')).toBe(true);
        expect(isRepMode('whatever')).toBe(false);
    });
});
