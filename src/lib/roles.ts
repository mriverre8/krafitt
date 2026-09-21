/** Who may do what with a routine. No Prisma, no React: the server enforces
    with these and the screens hide with them, so the two cannot disagree. */

/** Owner is not a stored row — it is being the routine's creator. The rest are
    `RoutineMember.role`. An athlete will land here one day; it is left out
    until the cursor it would need is per person rather than per routine. */
export type Role = 'owner' | 'coach' | 'scout';

/** What someone holds on a routine: a role, or nothing at all. */
export type Grant = Role | null;

/** The roles that can be handed to someone else. */
export const ASSIGNABLE = ['coach', 'scout'] as const;
export type Assignable = (typeof ASSIGNABLE)[number];

/**
 * What the search adds someone as: the role that can do least. Being let in is
 * one click and the list is where a role is chosen, so the click that cannot
 * be thought about first is the one that grants nothing but reading.
 *
 * Kept as the literal rather than widened, so that comparing against it tells
 * the type checker which roles are left.
 */
export const DEFAULT_ROLE = 'scout' satisfies Assignable;

const ROLES: readonly string[] = ['owner', ...ASSIGNABLE];

/** A role column read back from the database, which is a plain String. */
export const toRole = (value: unknown): Role | null =>
    ROLES.includes(value as string) ? (value as Role) : null;

export const isAssignable = (value: unknown): value is Assignable =>
    ASSIGNABLE.includes(value as Assignable);

/**
 * Renaming, the duration and the plan itself. Nothing here says a locked
 * routine may be edited: `requireEditableRoutine` still has the last word, and
 * a coach meets exactly the conditions the owner does.
 */
export const canEditPlan = (role: Grant) =>
    role === 'owner' || role === 'coach';

/** Deleting, visibility, activating, training, and who else gets in. The
    routine's own progress belongs to one person, so this stays the creator. */
export const canManage = (role: Grant) => role === 'owner';

/** Reading the plan and the history. A public routine opens the plan to
    everyone; the history only ever opens to these. */
export const canView = (role: Grant) => role !== null;
