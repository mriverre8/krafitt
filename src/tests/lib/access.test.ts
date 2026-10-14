import {
    requireEditableRoutine,
    requireRoutine,
    requireUnstartedRoutine,
    routineIdOfWorkout,
} from '@/lib/access';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const findRoutine = vi.fn();
const countSessions = vi.fn();
const findWorkout = vi.fn();
const countWorkouts = vi.fn();

vi.mock('@/lib/db', () => ({
    prisma: {
        routine: { findUnique: (...args: unknown[]) => findRoutine(...args) },
        workoutSession: {
            count: (...args: unknown[]) => countSessions(...args),
        },
        workout: {
            findUnique: (...args: unknown[]) => findWorkout(...args),
            count: (...args: unknown[]) => countWorkouts(...args),
        },
    },
}));

// The real translator, so the messages under test are the shipped ones.
vi.mock('@/i18n/server', async () => {
    const { createT, dictionaries } = await import('@/i18n/config');
    return { getT: async () => createT(dictionaries.en) };
});

/** On the shelf: never activated, never trained. Four weeks of two days. */
const shelved = {
    id: 'r1',
    creatorId: 'ada',
    isActive: false,
    cursor: 0,
    durationWeeks: 4,
};

beforeEach(() => {
    findRoutine.mockReset().mockResolvedValue(shelved);
    countSessions.mockReset().mockResolvedValue(0);
    findWorkout.mockReset().mockResolvedValue({ routineId: 'r1' });
    countWorkouts.mockReset().mockResolvedValue(2);
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

    // The plan stays open while it is trained: what was logged is matched
    // against it, never rewritten.
    it('allows a routine that is being trained', async () => {
        const training = { ...shelved, isActive: true, cursor: 3 };
        findRoutine.mockResolvedValue(training);
        await expect(requireEditableRoutine('r1', 'ada')).resolves.toEqual(
            training
        );
    });

    it('closes a routine that is over', async () => {
        findRoutine.mockResolvedValue({ ...shelved, cursor: 8 });
        await expect(requireEditableRoutine('r1', 'ada')).rejects.toThrow(
            'This routine is already finished'
        );
        expect(countWorkouts).toHaveBeenCalledWith({
            where: { routineId: 'r1' },
        });
    });

    it('checks who is asking before it checks the state', async () => {
        await expect(requireEditableRoutine('r1', 'bob')).rejects.toThrow(
            'You do not have access to this routine'
        );
        expect(countWorkouts).not.toHaveBeenCalled();
    });
});

describe('requireUnstartedRoutine', () => {
    it('allows a routine still on the shelf', async () => {
        await expect(requireUnstartedRoutine('r1', 'ada')).resolves.toEqual(
            shelved
        );
    });

    // Being active is enough on its own — training starts the moment it goes
    // live, and the cursor counts its days by position from then on.
    it('fixes the days of a routine that has been lived in', async () => {
        const started = 'A routine you have started cannot gain or lose days';

        findRoutine.mockResolvedValue({ ...shelved, isActive: true });
        await expect(requireUnstartedRoutine('r1', 'ada')).rejects.toThrow(
            started
        );

        findRoutine.mockResolvedValue({ ...shelved, cursor: 1 });
        await expect(requireUnstartedRoutine('r1', 'ada')).rejects.toThrow(
            started
        );

        findRoutine.mockResolvedValue(shelved);
        countSessions.mockResolvedValue(1);
        await expect(requireUnstartedRoutine('r1', 'ada')).rejects.toThrow(
            started
        );
        expect(countSessions).toHaveBeenCalledWith({
            where: { routineId: 'r1' },
        });
    });

    // Ownership is settled before anything else is read: a stranger never gets
    // as far as learning whether the routine has been trained.
    it('checks who is asking before it checks the state', async () => {
        await expect(requireUnstartedRoutine('r1', 'bob')).rejects.toThrow(
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

/** A workout: one day, no duration, done twice so far and on the shelf now. */
const workout = {
    ...shelved,
    kind: 'workout',
    durationWeeks: null,
    cursor: 2,
};

describe('workouts', () => {
    // Between one time and the next it is as open as a routine on the shelf,
    // logs and all: that is when exercises get swapped and archived.
    it('can be edited between one time and the next', async () => {
        findRoutine.mockResolvedValue(workout);
        countSessions.mockResolvedValue(2);
        await expect(requireEditableRoutine('r1', 'ada')).resolves.toEqual(
            workout
        );
    });

    it('cannot be edited while it is being done', async () => {
        findRoutine.mockResolvedValue({ ...workout, isActive: true });
        await expect(requireEditableRoutine('r1', 'ada')).rejects.toThrow(
            'A workout in progress cannot be edited'
        );
    });

    // Duration, people, visibility: asking for a routine turns a workout away.
    it('is refused where only a routine will do', async () => {
        findRoutine.mockResolvedValue(workout);
        await expect(requireRoutine('r1', 'ada', 'routine')).rejects.toThrow(
            'You do not have access to this routine'
        );
        await expect(requireRoutine('r1', 'ada', 'workout')).resolves.toEqual(
            workout
        );
    });

    // Its one day is the one it was made with, for good.
    it('never gains or loses a day', async () => {
        findRoutine.mockResolvedValue({ ...workout, cursor: 0 });
        await expect(requireUnstartedRoutine('r1', 'ada')).rejects.toThrow(
            'You do not have access to this routine'
        );
    });
});
