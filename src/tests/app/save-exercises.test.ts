import { saveExercises } from '@/app/actions';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ requireUser: async () => ({ id: 'u1' }) }));
vi.mock('@/lib/db', () => ({ prisma: {} }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// The real translator, so the messages under test are the shipped ones.
vi.mock('@/i18n/server', async () => {
    const { createT, dictionaries } = await import('@/i18n/config');
    return { getT: async () => createT(dictionaries.en) };
});

const set = (patch: Record<string, unknown> = {}) => ({
    kind: 'normal',
    mode: 'range',
    repMin: '8',
    repMax: '10',
    value: '',
    technique: '',
    ...patch,
});

/** Every plan below is turned away before the database is touched. */
async function errorFor(plan: unknown) {
    const data = new FormData();
    data.set('workoutId', 'w1');
    data.set('plan', typeof plan === 'string' ? plan : JSON.stringify(plan));
    return (await saveExercises({}, data)).error;
}

// The message sits under the whole day, so it has to say where the fault is.
describe('saveExercises', () => {
    it('names the exercise and the set a bad number is in', async () => {
        expect(
            await errorFor([
                { id: null, name: 'Dips', sets: [set()] },
                {
                    id: null,
                    name: 'Bench press',
                    sets: [set(), set({ repMax: '-6' })],
                },
            ])
        ).toBe('Bench press, set 2: reps must be a whole number from 0 to 999');
    });

    it('falls back on the exercise number when it has no name', async () => {
        expect(
            await errorFor([
                {
                    id: null,
                    name: ' ',
                    sets: [set({ mode: 'time', repMin: '-30' })],
                },
            ])
        ).toBe(
            'Exercise 1, set 1: seconds must be a whole number from 0 to 999'
        );
    });

    it('names a rest-pause set by its own label', async () => {
        expect(
            await errorFor([
                {
                    id: null,
                    name: 'Curl',
                    sets: [set(), set({ kind: 'rest', value: '-5' })],
                },
            ])
        ).toBe(
            'Curl, set RP1: the pause must be a whole number of seconds from 0 to 99'
        );
    });

    it('says what a plan it cannot read at all is', async () => {
        expect(await errorFor('{nope')).toBe(
            'The day could not be read. Reload the page and try again.'
        );
        expect(await errorFor([])).toBe(
            'A day holds between 1 and 30 exercises'
        );
    });
});
