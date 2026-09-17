import {
    requireEditableRoutine,
    requireRoutine,
    routineIdOfWorkout,
} from '@/lib/access';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const findRoutine = vi.fn();
const countSessions = vi.fn();
const findWorkout = vi.fn();

vi.mock('@/lib/db', () => ({
    prisma: {
        routine: { findUnique: (...args: unknown[]) => findRoutine(...args) },
        workoutSession: {
            count: (...args: unknown[]) => countSessions(...args),
        },
        workout: { findUnique: (...args: unknown[]) => findWorkout(...args) },
    },
}));

// The real translator, so the messages under test are the shipped ones.
vi.mock('@/i18n/server', async () => {
    const { createT, dictionaries } = await import('@/i18n/config');
    return { getT: async () => createT(dictionaries.en) };
});

/** On the shelf: never activated, never trained. The only editable state. */
const shelved = {
    id: 'r1',
    creatorId: 'ada',
    isActive: false,
    cursor: 0,
};

beforeEach(() => {
    findRoutine.mockReset().mockResolvedValue(shelved);
    countSessions.mockReset().mockResolvedValue(0);
    findWorkout.mockReset().mockResolvedValue({ routineId: 'r1' });
});

describe('requireRoutine', () => {
    it('hands back the routine to whoever created it', async () => {
        await expect(requireRoutine('r1', 'ada')).resolves.toEqual(shelved);
        expect(findRoutine).toHaveBeenCalledWith({ where: { id: 'r1' } });
    });

    it('refuses a routine that is not there', async () => {
        findRoutine.mockResolvedValue(null);
        await expect(requireRoutine('r1', 'ada')).rejects.toThrow(
            'Routine not found'
        );
    });

    // The whole point of the gate: another account's routine is refused, and
    // nothing about it comes back with the refusal.
    it("refuses someone else's routine", async () => {
        await expect(requireRoutine('r1', 'bob')).rejects.toThrow(
            'You do not have access to this routine'
        );
    });
});

describe('requireEditableRoutine', () => {
    it('allows a routine still on the shelf', async () => {
        await expect(requireEditableRoutine('r1', 'ada')).resolves.toEqual(
            shelved
        );
    });

    // Being active is enough on its own — training starts the moment it goes
    // live, and the plan is what the sessions will be logged against.
    it('freezes a routine that has been lived in', async () => {
        const started = 'A routine you have started cannot be edited';

        findRoutine.mockResolvedValue({ ...shelved, isActive: true });
        await expect(requireEditableRoutine('r1', 'ada')).rejects.toThrow(
            started
        );

        findRoutine.mockResolvedValue({ ...shelved, cursor: 1 });
        await expect(requireEditableRoutine('r1', 'ada')).rejects.toThrow(
            started
        );

        findRoutine.mockResolvedValue(shelved);
        countSessions.mockResolvedValue(1);
        await expect(requireEditableRoutine('r1', 'ada')).rejects.toThrow(
            started
        );
        expect(countSessions).toHaveBeenCalledWith({
            where: { routineId: 'r1' },
        });
    });

    // Ownership is settled before anything else is read: a stranger never gets
    // as far as learning whether the routine has been trained.
    it('checks who is asking before it checks the state', async () => {
        await expect(requireEditableRoutine('r1', 'bob')).rejects.toThrow(
            'You do not have access to this routine'
        );
        expect(countSessions).not.toHaveBeenCalled();
    });
});

describe('routineIdOfWorkout', () => {
    it('answers with the routine the day belongs to', async () => {
        await expect(routineIdOfWorkout('w1')).resolves.toBe('r1');
        expect(findWorkout).toHaveBeenCalledWith({
            where: { id: 'w1' },
            select: { routineId: true },
        });
    });

    it('refuses a day that is not there', async () => {
        findWorkout.mockResolvedValue(null);
        await expect(routineIdOfWorkout('w1')).rejects.toThrow(
            'Workout not found'
        );
    });
});
