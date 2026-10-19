import type { Prisma } from '@/generated/prisma/client';
import { prisma } from './db';
import {
    toLogs,
    toPrevious,
    type SlotLog,
    type SlottedExercise,
} from './history';
import { OWNER_PREVIEW_SIZE } from './pagination';
import {
    flatSets,
    isSessionComplete,
    pickableDays,
    shownDay,
    positionFromCursor,
    toKind,
    type Logs,
    type RoutineKind,
} from './progress';
import { dayKey } from './training-year';

/**
 * A day's plan: its exercises in order, with their sets. Archived exercises
 * are left out — they are only kept so their logs come back with them — and
 * this is written once, so that no query that reads the plan can forget to.
 */
export const planExercises = {
    where: { archived: false },
    orderBy: { order: 'asc' },
    include: { sets: { orderBy: { order: 'asc' } } },
} satisfies Prisma.Workout$exercisesArgs;

/** A set a day taken up again already had when it was left: kept as it was. */
export const isLockedLog = (log: { createdAt: Date }, leftAt: Date | null) =>
    leftAt !== null && log.createdAt <= leftAt;

/**
 * What the day on the home screen can be changed to, from this week's
 * sessions: every day not done in full, those left incomplete marked. Done
 * means every set of the plan as it stands now, like closing a day.
 */
export function weekChoices(
    cursor: number,
    workouts: { id: string; name: string; exercises: SlottedExercise[] }[],
    sessions: { workoutId: string; completedAt: Date | null; logs: SlotLog[] }[]
) {
    const complete = new Set<number>();
    const closed = new Set<number>();
    for (const session of sessions) {
        const index = workouts.findIndex((w) => w.id === session.workoutId);
        if (index < 0) continue;
        const { exercises } = workouts[index];
        if (isSessionComplete(exercises, toLogs(session.logs, exercises)))
            complete.add(index);
        else if (session.completedAt) closed.add(index);
    }
    return pickableDays(cursor, workouts.length, complete, closed).map(
        ({ index, incomplete }) => ({
            id: workouts[index].id,
            name: workouts[index].name,
            index,
            incomplete,
        })
    );
}

/**
 * Whether this week still has days to take up again: the cursor stays on its
 * last day, done or left, until they are done or the week is skipped. A day
 * with nothing in it is never one.
 */
export const weekLeftOpen = (
    ...args: Parameters<typeof weekChoices>
): boolean =>
    weekChoices(...args).some(
        (choice) => flatSets(args[1][choice.index].exercises).length > 0
    );

/** Today's workout from the user's active routine. */
export async function todayWorkout(userId: string) {
    const routine = await prisma.routine.findFirst({
        where: { creatorId: userId, isActive: true },
        include: {
            workouts: {
                orderBy: { order: 'asc' },
                include: { exercises: planExercises },
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

    const week = position.week;
    const single = toKind(routine.kind) === 'workout';
    // A picked day takes the cursor's place until it is done.
    const day = shownDay(
        routine.cursor,
        routine.workouts.length,
        routine.workouts.findIndex((w) => w.id === routine.pickedWorkoutId)
    );
    const workout = routine.workouts[day];

    const [session, previousSessions, thisWeek] = await Promise.all([
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
        // What the day can be changed to: a workout has only the one.
        single
            ? []
            : prisma.workoutSession.findMany({
                  where: { userId, routineId: routine.id, week },
                  include: { logs: true },
              }),
    ]);

    const logs = toLogs(session?.logs ?? [], workout.exercises);

    // The day the user finished stays on screen until the next fetch: this is
    // where it is left behind, not in `logSet`. Finished means every set of the
    // plan as it stands now: taking the one set still waiting out of the day
    // closes it too, and no log would ever arrive to close it otherwise.
    // Guarded on the cursor we read, so a concurrent skip cannot make it jump
    // two days.
    //
    // A workout moves on the same way, but there is no next time to show: it
    // leaves the home screen, and is done again only when started again.
    //
    // A picked day leaves the cursor where it is: it goes back to the day it
    // stood on, and steps over this one when it gets here, already complete.
    // Moving the cursor drops the pick, so none outlives its week. One picked
    // to be taken up again, closed with its blanks, is read until started.
    //
    // The last day of a week with days still to take up again does not leave
    // it: it stays on screen, done in full or to be taken up again itself,
    // until they are done or the week is skipped.
    const complete = isSessionComplete(workout.exercises, logs);
    if (
        session &&
        (complete || (session.completedAt && day === position.workoutIndex))
    ) {
        const stays =
            !single &&
            day === position.workoutIndex &&
            day === routine.workouts.length - 1 &&
            weekLeftOpen(routine.cursor, routine.workouts, [
                ...thisWeek.filter((s) => s.workoutId !== workout.id),
                session,
            ]);
        await prisma.$transaction([
            prisma.workoutSession.updateMany({
                where: { id: session.id, completedAt: null },
                data: { completedAt: new Date() },
            }),
            ...(stays
                ? []
                : [
                      day !== position.workoutIndex
                          ? prisma.routine.updateMany({
                                where: {
                                    id: routine.id,
                                    pickedWorkoutId: workout.id,
                                },
                                data: { pickedWorkoutId: null },
                            })
                          : prisma.routine.updateMany({
                                where: {
                                    id: routine.id,
                                    cursor: routine.cursor,
                                },
                                data: {
                                    cursor: { increment: 1 },
                                    isActive: single ? false : undefined,
                                    pickedWorkoutId: null,
                                },
                            }),
                  ]),
        ]);
        if (!stays) {
            if (single) return null;
            return todayWorkout(userId);
        }
    }

    return {
        routine,
        finished: false as const,
        workout,
        day,
        choices: weekChoices(routine.cursor, routine.workouts, thisWeek),
        week,
        // A session is opened by starting the day (`startDay`) or by its
        // first set: either way, the day is under way — unless it was closed.
        // One done in full stays shown as done.
        started: session !== null && (!session.completedAt || complete),
        logs,
        locked: toLogs(
            session?.logs.filter((log) => isLockedLog(log, session.leftAt)) ??
                [],
            workout.exercises
        ),
        previous: toPrevious(previousSessions, workout.exercises),
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
                where: planExercises.where,
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
    {
        q,
        kind = 'routine',
        ...page
    }: { skip?: number; take?: number; q?: string; kind?: RoutineKind } = {}
) {
    return prisma.routine.findMany({
        where: { creatorId: userId, kind, name: q ? like(q) : undefined },
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

/** Everyone asked into a routine who has not answered yet, oldest first. */
export async function routineInvites(routineId: string) {
    const invites = await prisma.routineRequest.findMany({
        where: { routineId, kind: 'member' },
        orderBy: { createdAt: 'asc' },
        select: {
            recipient: { select: { id: true, name: true, image: true } },
        },
    });
    return invites.map(({ recipient }) => recipient);
}

/** What is waiting on someone's answer about one kind of plan: each section
    keeps its own inbox, routines in one and workouts in the other. */
const waitingOn = (userId: string, kind: RoutineKind) => ({
    recipientId: userId,
    routine: { kind },
});

/** What is waiting on someone's answer, newest first. Whoever asked is the
    routine's creator: only they may ask. */
export function requestsOf(
    userId: string,
    page: { skip: number; take: number },
    kind: RoutineKind = 'routine'
) {
    return prisma.routineRequest.findMany({
        where: waitingOn(userId, kind),
        orderBy: { createdAt: 'desc' },
        ...page,
        select: {
            id: true,
            kind: true,
            addSender: true,
            routine: {
                select: {
                    name: true,
                    kind: true,
                    creator: { select: { id: true, name: true, image: true } },
                },
            },
        },
    });
}

export function countRequests(userId: string, kind: RoutineKind = 'routine') {
    return prisma.routineRequest.count({ where: waitingOn(userId, kind) });
}

export function countRoutines(userId: string, kind: RoutineKind = 'routine') {
    return prisma.routine.count({ where: { creatorId: userId, kind } });
}

/** What was logged in one session: a week of a routine's day, or one time a
    workout was done. */
export async function sessionLogs(
    userId: string,
    workoutId: string,
    week: number
) {
    const session = await prisma.workoutSession.findUnique({
        where: { userId_workoutId_week: { userId, workoutId, week } },
        select: { logs: true },
    });
    return session?.logs ?? [];
}

/** Whatever is on the user's home screen now, routine or workout: at most one
    of them is active. Enough to warn about it before something takes its place. */
export function activeRoutine(userId: string) {
    return prisma.routine.findFirst({
        where: { creatorId: userId, isActive: true },
        select: {
            id: true,
            name: true,
            kind: true,
            cursor: true,
            durationWeeks: true,
            _count: { select: { workouts: true } },
        },
    });
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
 * would have been is only knowable from the plan. Only the plan as it stands:
 * an archived exercise keeps its logs, which come back with it if it is named
 * again, but the history shows what is being trained.
 */
export async function routineHistory(routineId: string) {
    const routine = await prisma.routine.findUnique({
        where: { id: routineId },
        include: {
            // The export names whose routine it is to anyone else.
            creator: { select: { name: true } },
            workouts: {
                orderBy: { order: 'asc' },
                include: { exercises: planExercises },
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

    const exercisesOf = new Map(
        routine.workouts.map((workout) => [workout.id, workout.exercises])
    );
    const byDay: Record<string, Record<number, Logs>> = {};
    // When each day of each week was started: what the export dates it by.
    const startedOn: Record<string, Record<number, Date>> = {};
    for (const session of sessions) {
        (byDay[session.workoutId] ??= {})[session.week] = toLogs(
            session.logs,
            exercisesOf.get(session.workoutId) ?? []
        );
        (startedOn[session.workoutId] ??= {})[session.week] = session.startedAt;
    }

    // How long each day took, for the summary above the history.
    const timings = sessions.map(({ startedAt, completedAt }) => ({
        startedAt,
        completedAt,
    }));

    return { routine, byDay, startedOn, timings };
}

/** The routine and its plan: archived exercises are left out, so whatever is
    built on this — the editor, validating, activating, copying — never sees
    them. */
export async function routineDetail(routineId: string) {
    return prisma.routine.findUnique({
        where: { id: routineId },
        include: {
            creator: { select: { name: true, image: true } },
            // members: the options menu counts them beside the way in.
            _count: { select: { sessions: true, members: true } },
            workouts: {
                orderBy: { order: 'asc' },
                include: { exercises: planExercises },
            },
        },
    });
}

/**
 * The archived exercises of every day of a routine, by name: what the editor's
 * name field offers back. Picking one brings that exercise back with its
 * history, which only ever lives in its own day — so the list is per day.
 */
export async function retiredExerciseNames(routineId: string) {
    const exercises = await prisma.exercise.findMany({
        where: { archived: true, workout: { routineId } },
        distinct: ['workoutId', 'name'],
        orderBy: { name: 'asc' },
        select: { workoutId: true, name: true },
    });

    const byDay: Record<string, string[]> = {};
    for (const exercise of exercises)
        (byDay[exercise.workoutId] ??= []).push(exercise.name);
    return byDay;
}
