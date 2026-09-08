import { createT } from '@/i18n/config';
import { en } from '@/i18n/en';
import { formatReps, isRepMode, repMode } from '@/lib/reps';
import { describe, expect, it } from 'vitest';

const t = createT(en);

describe('reps', () => {
    it('reads the three prescriptions off the two columns', () => {
        expect(repMode({ repMin: 6, repMax: 8 })).toBe('range');
        expect(repMode({ repMin: 8, repMax: 8 })).toBe('fixed');
        expect(repMode({ repMin: null, repMax: null })).toBe('amrap');
    });

    it('formats each of them', () => {
        expect(formatReps({ repMin: 6, repMax: 8 }, t)).toBe('6-8 reps');
        expect(formatReps({ repMin: 8, repMax: 8 }, t)).toBe('8 reps');
        expect(formatReps({ repMin: null, repMax: null }, t)).toBe('AMRAP');
    });

    it('only accepts the known modes', () => {
        expect(isRepMode('amrap')).toBe(true);
        expect(isRepMode('whatever')).toBe(false);
    });
});
