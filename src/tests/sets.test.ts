import { createT } from '@/i18n/config';
import { en } from '@/i18n/en';
import {
    badSetValue,
    groupAt,
    readSetValue,
    setFullLabel,
    setName,
    setPlaces,
    setShortLabel,
} from '@/lib/sets';
import { describe, expect, it } from 'vitest';

const t = createT(en);

/** A working set, then its two drops, then the next working set. */
const exercise = [
    { kind: 'normal' },
    { kind: 'drop' },
    { kind: 'drop' },
    { kind: 'normal' },
    { kind: 'rest' },
];

const labels = (sets: { kind?: string }[]) =>
    setPlaces(sets).map(setShortLabel);

describe('setPlaces', () => {
    it('numbers working sets down the exercise, and shows drops unnumbered', () => {
        expect(labels(exercise)).toEqual(['1', 'DS', 'DS', '2', 'RP']);
    });

    it('reads a set with no kind at all as a working set', () => {
        expect(labels([{}, {}, { kind: 'nonsense' }])).toEqual(['1', '2', '3']);
    });

    // The row says DS twice; the labels behind it cannot.
    it('numbers them anyway for the field labels', () => {
        expect(setPlaces(exercise).map(setName)).toEqual([
            '1',
            'DS1',
            'DS2',
            '2',
            'RP1',
        ]);
    });
});

describe('setFullLabel', () => {
    it('carries the per cent or the pause', () => {
        expect(setFullLabel({ kind: 'drop', value: 20 }, t)).toBe(
            'Drop set −20%'
        );
        expect(setFullLabel({ kind: 'rest', value: 15 }, t)).toBe(
            'Rest-pause set 15s'
        );
    });

    it('names the kind on its own while the amount is blank', () => {
        expect(setFullLabel({ kind: 'drop', value: null }, t)).toBe('Drop set');
    });
});

describe('groupAt', () => {
    it('reports the kind a working set already carries', () => {
        expect(groupAt(exercise, 0).kind).toBe('drop');
        expect(groupAt(exercise, 3).kind).toBe('rest');
    });

    it('has no kind while the set carries none', () => {
        expect(groupAt([{ kind: 'normal' }], 0)).toEqual({
            kind: null,
            insertAt: 1,
        });
    });

    // What keeps a run of drops together: the next one goes after the last.
    it('puts the next one behind the ones already there', () => {
        expect(groupAt(exercise, 0).insertAt).toBe(3);
        expect(groupAt(exercise, 3).insertAt).toBe(5);
    });
});

describe('badSetValue', () => {
    it('holds the routine back on a rest-pause with no pause', () => {
        expect(badSetValue({ kind: 'rest', value: null })).toBe(true);
        expect(badSetValue({ kind: 'rest', value: 15 })).toBe(false);
    });

    it('lets a drop set through without a per cent', () => {
        expect(badSetValue({ kind: 'drop', value: null })).toBe(false);
    });

    it('says nothing about a working set', () => {
        expect(badSetValue({ kind: 'normal' })).toBe(false);
    });
});

describe('readSetValue', () => {
    it('keeps a blank blank and rejects what is out of range', () => {
        expect(readSetValue('', 'drop')).toBeNull();
        expect(readSetValue('20', 'drop')).toBe(20);
        expect(readSetValue('120', 'drop')).toBeUndefined();
        expect(readSetValue('0', 'rest')).toBeUndefined();
        expect(readSetValue('90', 'rest')).toBe(90);
    });

    it('drops whatever a working set was sent', () => {
        expect(readSetValue('20', 'normal')).toBeNull();
    });
});
