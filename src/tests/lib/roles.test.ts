import {
    ASSIGNABLE,
    canEditPlan,
    canManage,
    canView,
    isAssignable,
    toRole,
    type Grant,
} from '@/lib/roles';
import { describe, expect, it } from 'vitest';

/** Everyone a routine can be looked at by, including nobody. */
const grants: Grant[] = ['owner', 'coach', 'scout', null];

describe('toRole', () => {
    it('reads back the roles the column can hold', () => {
        expect(toRole('owner')).toBe('owner');
        expect(toRole('coach')).toBe('coach');
        expect(toRole('scout')).toBe('scout');
    });

    // The column is a String, so nothing about what comes out of it is assumed:
    // a row written by an older build, or by hand, reads as no role rather than
    // as a role nothing knows how to check.
    it('refuses anything else, including a missing row', () => {
        expect(toRole('athlete')).toBeNull();
        expect(toRole('')).toBeNull();
        expect(toRole(undefined)).toBeNull();
        expect(toRole(null)).toBeNull();
        expect(toRole(0)).toBeNull();
    });
});

describe('isAssignable', () => {
    it('is the two roles a person can be given', () => {
        expect(ASSIGNABLE).toEqual(['coach', 'scout']);
        expect(isAssignable('coach')).toBe(true);
        expect(isAssignable('scout')).toBe(true);
    });

    // Owner is being the creator, not a row anyone can be handed, and the
    // athlete does not exist yet. Both are refused at the same gate.
    it('refuses owner, the athlete, and nonsense', () => {
        expect(isAssignable('owner')).toBe(false);
        expect(isAssignable('athlete')).toBe(false);
        expect(isAssignable(undefined)).toBe(false);
    });
});

describe('what each grant allows', () => {
    it('lets the owner and the coach change the plan', () => {
        expect(grants.filter(canEditPlan)).toEqual(['owner', 'coach']);
    });

    // The scout is the whole point of the pair: it sees everything a coach
    // sees and writes nothing.
    it('keeps managing the routine with its creator alone', () => {
        expect(grants.filter(canManage)).toEqual(['owner']);
    });

    it('lets anyone who holds a role read it', () => {
        expect(grants.filter(canView)).toEqual(['owner', 'coach', 'scout']);
    });

    // Nobody is nobody: a stranger falls through every gate. A public routine
    // opening its plan is decided by the page, not here.
    it('gives someone with no role nothing', () => {
        expect(canEditPlan(null)).toBe(false);
        expect(canManage(null)).toBe(false);
        expect(canView(null)).toBe(false);
    });
});
