import {
    requireEditableRoutine,
    requireRoutine,
    routineIdOfWorkout,
} from '@/lib/access';
import { canEditPlan } from '@/lib/roles';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const findRoutine = vi.fn();
const countSessions = vi.fn();
const findWorkout = vi.fn();
const findMember = vi.fn();

vi.mock('@/lib/db', () => ({
    prisma: {
        routine: { findUnique: (...args: unknown[]) => findRoutine(...args) },
        workoutSession: {
            count: (...args: unknown[]) => countSessions(...args),
        },
        workout: { findUnique: (...args: unknown[]) => findWorkout(...args) },
        routineMember: {
            findUnique: (...args: unknown[]) => findMember(...args),
        },
    },
}));

/** Whoever is asking holds this row. No row is the stranger. */
const asMember = (role: string) => findMember.mockResolvedValue({ role });

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
    findMember.mockReset().mockResolvedValue(null);
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

describe('requireRoutine with a wider rule', () => {
    // The default is what every caller that says nothing keeps getting, and it
    // is the one that must not have moved: six actions still lean on it.
    it('still answers to the creator alone when asked nothing', async () => {
        asMember('coach');
        await expect(requireRoutine('r1', 'bob')).rejects.toThrow(
            'You do not have access to this routine'
        );
    });

    it('lets a coach through a rule that allows one', async () => {
        asMember('coach');
        await expect(requireRoutine('r1', 'bob', canEditPlan)).resolves.toEqual(
            shelved
        );
        expect(findMember).toHaveBeenCalledWith({
            where: { routineId_userId: { routineId: 'r1', userId: 'bob' } },
            select: { role: true },
        });
    });

    // The scout is the whole point of the pair: the same door, and it reads.
    it('refuses a scout the same rule', async () => {
        asMember('scout');
        await expect(requireRoutine('r1', 'bob', canEditPlan)).rejects.toThrow(
            'You do not have access to this routine'
        );
    });

    it('refuses someone with no row at all', async () => {
        await expect(requireRoutine('r1', 'bob', canEditPlan)).rejects.toThrow(
            'You do not have access to this routine'
        );
    });

    // The role is a plain String column: a row written by a later build, or by
    // hand, is no role rather than a role nothing knows how to weigh. This is
    // where the athlete lands until it is implemented.
    it('refuses a role it does not recognise', async () => {
        asMember('athlete');
        await expect(requireRoutine('r1', 'bob', canEditPlan)).rejects.toThrow(
            'You do not have access to this routine'
        );
    });

    // Being the creator is not a row anyone was granted, so none is looked for.
    it('never looks up a membership for the creator', async () => {
        await expect(requireRoutine('r1', 'ada', canEditPlan)).resolves.toEqual(
            shelved
        );
        expect(findMember).not.toHaveBeenCalled();
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

    it('hands the same shelved routine to a coach', async () => {
        asMember('coach');
        await expect(requireEditableRoutine('r1', 'bob')).resolves.toEqual(
            shelved
        );
    });

    // The state gate does not care who is asking: a coach is frozen out of a
    // live routine on exactly the terms the owner is.
    it('freezes a coach on a routine that has been lived in', async () => {
        asMember('coach');
        findRoutine.mockResolvedValue({ ...shelved, isActive: true });
        await expect(requireEditableRoutine('r1', 'bob')).rejects.toThrow(
            'A routine you have started cannot be edited'
        );
    });

    it('never lets a scout edit, however untouched the routine', async () => {
        asMember('scout');
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
