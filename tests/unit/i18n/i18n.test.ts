import { ca } from '@/i18n/ca';
import { createT, interpolate, isLocale } from '@/i18n/config';
import { en } from '@/i18n/en';
import { es } from '@/i18n/es';
import { describe, expect, it } from 'vitest';

describe('i18n', () => {
    it('every locale defines the same keys', () => {
        const keys = Object.keys(en).sort();
        expect(Object.keys(es).sort()).toEqual(keys);
        expect(Object.keys(ca).sort()).toEqual(keys);
    });

    it('no locale leaves a blank string', () => {
        for (const dict of [en, es, ca]) {
            expect(
                Object.entries(dict).filter(([, value]) => value.trim() === '')
            ).toEqual([]);
        }
    });

    it('interpolates params and keeps unknown placeholders', () => {
        expect(
            interpolate('Week {week} of {total}', { week: 2, total: 8 })
        ).toBe('Week 2 of 8');
        expect(interpolate('Hi {who}', {})).toBe('Hi {who}');
    });

    it('picks the singular for exactly 1 and the plural otherwise', () => {
        const template = '{name}: {n} {n|set|sets}';
        expect(interpolate(template, { name: 'Squat', n: 0 })).toBe(
            'Squat: 0 sets'
        );
        expect(interpolate(template, { name: 'Squat', n: 1 })).toBe(
            'Squat: 1 set'
        );
        expect(interpolate(template, { name: 'Squat', n: 2 })).toBe(
            'Squat: 2 sets'
        );
        // A missing param leaves the token as it is, like a plain one.
        expect(interpolate(template, { name: 'Squat' })).toBe(
            'Squat: {n} {n|set|sets}'
        );
    });

    // Every plural token in the dictionaries is well formed: no stray
    // braces or bars are left behind with every param set to 1 or 2.
    it('resolves every plural token in every locale', () => {
        for (const dict of [en, es, ca]) {
            for (const template of Object.values(dict)) {
                const keys = [...template.matchAll(/\{(\w+)/g)].map(
                    ([, key]) => key
                );
                for (const n of [1, 2]) {
                    const params = Object.fromEntries(keys.map((k) => [k, n]));
                    expect(interpolate(template, params)).not.toMatch(/[{}|]/);
                }
            }
        }
    });

    it('translates per locale', () => {
        expect(createT(en)('today.week', { week: 1, total: 4 })).toBe(
            'Week 1 of 4'
        );
        expect(createT(es)('today.week', { week: 1, total: 4 })).toBe(
            'Semana 1 de 4'
        );
        expect(createT(ca)('today.week', { week: 1, total: 4 })).toBe(
            'Setmana 1 de 4'
        );
    });

    it('recognises supported locales only', () => {
        expect(isLocale('ca')).toBe(true);
        expect(isLocale('fr')).toBe(false);
    });
});
