import type { Prisma } from '@/generated/prisma/client';
import { prisma } from './db';
import { OWNER_PREVIEW_SIZE } from './pagination';
import {
    positionFromCursor,
    toEffort,
    type Logs,
    type PreviousLogs,
} from './progress';
import { dayKey } from './training-year';

function toLogs(
    logs: {
        exerciseId: string;
        setIndex: number;
        weight: number;
        reps: number;
        effort: string;
    }[]
): Logs {
    const out: Logs = {};
    for (const l of logs)
        (out[l.exerciseId] ??= {})[l.setIndex] = {
            weight: l.weight,
            reps: l.reps,
            effort: toEffort(l.effort),
        };
    return out;
}

/**
 * The last value every set was given, week by week. Sessions come in oldest
 * first so the newest week wins, and unfinished ones count too: a day skipped
 * half-done still leaves its numbers behind for the sets that were logged, and
 * the sets that were not keep whatever the week before them left.
 */
function toPrevious(
    sessions: {
        week: number;
        logs: {
            exerciseId: string;
            setIndex: number;
            weight: number;
            reps: number;
            effort: string;
        }[];
    }[]
): PreviousLogs {
    const out: PreviousLogs = {};
    for (const session of sessions)
        for (const l of session.logs)
            (out[l.exerciseId] ??= {})[l.setIndex] = {
                weight: l.weight,
                reps: l.reps,
                effort: toEffort(l.effort),
                week: session.week,
            };
    return out;
}

/** Today's workout from the user's active routine. */
export async function todayWorkout(userId: string) {
    const routine = await prisma.routine.findFirst({
        where: { creatorId: userId, isActive: true },
        include: {
            workouts: {
                orderBy: { order: 'asc' },
                include: {
                    exercises: {
                        orderBy: { order: 'asc' },
                        include: { sets: { orderBy: { order: 'asc' } } },
                    },
                },
            },
        },
    });
    if (!routine) return null;

    const position = positionFromCursor(
        routine.cursor,
        routine.workouts.length,
        routine.durationWeeks
    );
    if (!position) return { routine, finished: true as const };

    const workout = routine.workouts[position.workoutIndex];
    const week = position.week;

    const [session, previousSessions] = await Promise.all([
        prisma.workoutSession.findUnique({
            where: {
                userId_workoutId_week: { userId, workoutId: workout.id, week },
            },
            include: { logs: true },
        }),
        prisma.workoutSession.findMany({
            where: { userId, workoutId: workout.id, week: { lt: week } },
            orderBy: { week: 'asc' },
            include: { logs: true },
        }),
    ]);

    // The day the user finished stays on screen until the next fetch: this is
    // where it is left behind, not in `logSet`. Guarded on the cursor we read, so
    // a concurrent skip cannot make it jump two days.
    if (session?.completedAt) {
        await prisma.routine.updateMany({
            where: { id: routine.id, cursor: routine.cursor },
            data: { cursor: { increment: 1 } },
        });
        return todayWorkout(userId);
    }

    return {
        routine,
        finished: false as const,
        workout,
        day: position.workoutIndex,
        week,
        logs: toLogs(session?.logs ?? []),
        previous: toPrevious(previousSessions),
    };
}

/**
 * Who a profile is about: the header's name, picture, join date and the two
 * follow counts. The counts come along rather than being counted separately
 * because the follows page needs the same three numbers to draw its tabs and
 * page its list.
 */
export function profileUser(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
        select: {
            name: true,
            image: true,
            createdAt: true,
            _count: { select: { followers: true, following: true } },
        },
    });
}

export type FollowTab = 'followers' | 'following';

/** Which end of the row is the profile's owner: followers point at them. */
const followSide = (userId: string, tab: FollowTab) =>
    tab === 'followers' ? { followingId: userId } : { followerId: userId };

export async function isFollowing(followerId: string, followingId: string) {
    const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId, followingId } },
        select: { followerId: true },
    });
    return follow !== null;
}

/**
 * Which of these people the viewer already follows: one query for a whole page
 * of rows rather than one per row.
 */
export async function followingAmong(followerId: string, ids: string[]) {
    if (ids.length === 0) return new Set<string>();
    const rows = await prisma.follow.findMany({
        where: { followerId, followingId: { in: ids } },
        select: { followingId: true },
    });
    return new Set(rows.map((r) => r.followingId));
}

/**
 * One side of someone's follows, newest first.
 *
 * ponytail: both ends of the row are joined and one is thrown away, rather than
 * branching the select on `tab`. One join's worth of waste for a query that
 * always comes back the same shape; split it if a page of follows ever shows up
 * slow.
 */
export async function followList(
    userId: string,
    tab: FollowTab,
    page: { skip: number; take: number }
) {
    const person = { select: { id: true, name: true, image: true } };
    const follows = await prisma.follow.findMany({
        where: followSide(userId, tab),
        orderBy: { createdAt: 'desc' },
        ...page,
        select: { follower: person, following: person },
    });

    return follows.map((f) => (tab === 'followers' ? f.follower : f.following));
}

/**
 * What a routine card needs to draw itself: every row drags its whole plan —
 * days, exercises, sets — along with it, because the card says whether the
 * routine could go active, and only the plan knows that. Written once and
 * shared, so the two lists that use it cannot drift apart.
 */
const withPlan = {
    _count: { select: { workouts: true } },
    workouts: {
        orderBy: { order: 'asc' },
        select: {
            name: true,
            exercises: {
                select: {
                    name: true,
                    sets: {
                        select: {
                            repMode: true,
                            repMin: true,
                            repMax: true,
                            kind: true,
                            value: true,
                        },
                    },
                },
            },
        },
    },
} satisfies Prisma.RoutineInclude;

/**
 * The routines someone made.
 *
 * `page` cuts it down at the database rather than in the screen. Left out, the
 * query is the whole list: the profile needs all of them to count what the
 * user has done. Membership has no say here — a profile shows what that
 * person wrote, not what was lent to them.
 */
export async function routinesOf(
    userId: string,
    { q, ...page }: { skip?: number; take?: number; q?: string } = {}
) {
    return prisma.routine.findMany({
        where: { creatorId: userId, name: q ? like(q) : undefined },
        orderBy: { createdAt: 'desc' },
        ...page,
        include: withPlan,
    });
}

/** Routines `userId` was let into. The creator is never a member, so this
    never matches the user's own. */
const sharedWith = (userId: string) => ({ members: { some: { userId } } });

/** A case-blind "contains", the one way every search box here matches. */
const like = (q: string) => ({ contains: q, mode: 'insensitive' as const });

/** What a search on the shared list can be narrowed to. */
export const SHARED_SEARCH_FIELDS = ['routine', 'person', 'email'] as const;
export type SharedSearchField = (typeof SHARED_SEARCH_FIELDS)[number];

/** Routines `userId` was let into that a search on the shared list matches:
    by the routine's own name, or by whose it is — their name or their email.
    `by` narrows it to one of those; left out, any of them will do. No search,
    no narrowing. */
function sharedMatching(
    userId: string,
    q?: string,
    by?: SharedSearchField
): Prisma.RoutineWhereInput {
    if (!q) return sharedWith(userId);
    const fields = {
        routine: { name: like(q) },
        person: { creator: { name: like(q) } },
        email: { creator: { email: like(q) } },
    } satisfies Record<SharedSearchField, Prisma.RoutineWhereInput>;
    return {
        ...sharedWith(userId),
        OR: by ? [fields[by]] : Object.values(fields),
    };
}

/**
 * The people who let `userId` into at least one routine, each with the first
 * few of those routines and how many there are in all: the shared list is
 * grouped by owner, and each group only previews before it hands over to its
 * own page. Ordered by name, then id, so a page boundary never moves between
 * two people of the same name.
 *
 * Deliberately not `withPlan`. A card of somebody else's routine says nothing
 * about whether it could be set active — that is not a move you have — so
 * there is nothing here to drag its days, exercises and sets along for.
 */
export function sharingOwners(
    userId: string,
    page: { skip: number; take: number },
    q?: string,
    by?: SharedSearchField
) {
    // One filter for the owners, their count and their preview: an owner found
    // by name or email brings every routine they shared, one found through a
    // routine's name brings only the routines that matched.
    const where = sharedMatching(userId, q, by);
    return prisma.user.findMany({
        where: { routines: { some: where } },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        ...page,
        select: {
            id: true,
            name: true,
            image: true,
            _count: { select: { routines: { where } } },
            routines: {
                where,
                orderBy: { createdAt: 'desc' },
                take: OWNER_PREVIEW_SIZE,
                include: { _count: { select: { workouts: true } } },
            },
        },
    });
}

export function countSharingOwners(
    userId: string,
    q?: string,
    by?: SharedSearchField
) {
    return prisma.user.count({
        where: { routines: { some: sharedMatching(userId, q, by) } },
    });
}

/** One owner's routines that `userId` was let into, optionally only the ones
    whose name matches a search. */
export function sharedRoutinesOf(
    userId: string,
    ownerId: string,
    page: { skip: number; take: number },
    q?: string
) {
    return prisma.routine.findMany({
        where: {
            creatorId: ownerId,
            ...sharedWith(userId),
            name: q ? like(q) : undefined,
        },
        orderBy: { createdAt: 'desc' },
        ...page,
        include: { _count: { select: { workouts: true } } },
    });
}

/** Just enough of someone to title a page about them. */
export function userHeader(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, image: true },
    });
}

/** Just enough of a routine to title a page about it and say whose it is.
    The plan is a heavy thing to drag along for a heading. */
export function routineHeader(routineId: string) {
    return prisma.routine.findUnique({
        where: { id: routineId },
        select: { name: true, creatorId: true },
    });
}

/** Whether someone was let into a routine, for the pages that read rather
    than write. The creator is never a member: owning is not a row. */
export async function isMember(routineId: string, userId: string) {
    const member = await prisma.routineMember.findUnique({
        where: { routineId_userId: { routineId, userId } },
        select: { userId: true },
    });
    return member !== null;
}

/** Everyone let into a routine, oldest first. The creator is not in here:
    being the owner is not a row. */
export async function routineMembers(routineId: string) {
    const members = await prisma.routineMember.findMany({
        where: { routineId },
        orderBy: { createdAt: 'asc' },
        select: { user: { select: { id: true, name: true, image: true } } },
    });
    return members.map(({ user }) => user);
}

export function countRoutines(userId: string) {
    return prisma.routine.count({ where: { creatorId: userId } });
}

export function countSharedRoutines(
    userId: string,
    ownerId: string,
    q?: string
) {
    return prisma.routine.count({
        where: {
            creatorId: ownerId,
            ...sharedWith(userId),
            name: q ? like(q) : undefined,
        },
    });
}

/**
 * Every day the user logged something since `from`, as ISO date → sets logged.
 * Sessions across every routine, active or not: the graph is about the person,
 * not about one plan. A session that was opened and never logged into is not a
 * day trained, so it is left out.
 *
 * ponytail: days are keyed in UTC, which is the server's day, not necessarily
 * the user's. Send the client's offset in if a late-night set ever lands on the
 * wrong square.
 */
export async function trainingDays(userId: string, from: Date) {
    const sessions = await prisma.workoutSession.findMany({
        where: { userId, startedAt: { gte: from } },
        select: { startedAt: true, _count: { select: { logs: true } } },
    });

    const days: Record<string, number> = {};
    for (const session of sessions) {
        if (session._count.logs === 0) continue;
        const key = dayKey(session.startedAt);
        days[key] = (days[key] ?? 0) + session._count.logs;
    }
    return days;
}

/**
 * Everything the user has logged in one routine, by day and then by week.
 *
 * The plan comes along with it: a week nobody trained leaves no session behind,
 * and the history page still has to draw that week's blanks — which sets they
 * would have been is only knowable from the plan.
 */
export async function routineHistory(routineId: string) {
    const routine = await prisma.routine.findUnique({
        where: { id: routineId },
        include: {
            workouts: {
                orderBy: { order: 'asc' },
                include: {
                    exercises: {
                        orderBy: { order: 'asc' },
                        include: { sets: { orderBy: { order: 'asc' } } },
                    },
                },
            },
        },
    });
    if (!routine) return null;

    // Whose log this is, is settled by the routine and not by who is looking:
    // a member opening it reads the person who trains it, not their own blank.
    // Costs the round trip the Promise.all used to save.
    const sessions = await prisma.workoutSession.findMany({
        where: { routineId, userId: routine.creatorId },
        include: { logs: true },
    });

    const byDay: Record<string, Record<number, Logs>> = {};
    for (const session of sessions)
        (byDay[session.workoutId] ??= {})[session.week] = toLogs(session.logs);

    return { routine, byDay };
}

export async function routineDetail(routineId: string) {
    return prisma.routine.findUnique({
        where: { id: routineId },
        include: {
            creator: { select: { name: true, image: true } },
            // members: the options menu counts them beside the way in.
            _count: { select: { sessions: true, members: true } },
            workouts: {
                orderBy: { order: 'asc' },
                include: {
                    exercises: {
                        orderBy: { order: 'asc' },
                        include: { sets: { orderBy: { order: 'asc' } } },
                    },
                },
            },
        },
    });
}
