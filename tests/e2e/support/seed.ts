import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';

/**
 * Preconditions written straight to the e2e database, for the states a test
 * needs to start from but is not about (a complete routine to train, a public
 * one to save). The behaviour under test always goes through the UI.
 *
 * Plain SQL rather than the Prisma client: the generated client is ESM-only and
 * Playwright loads specs as CommonJS.
 */
// One connection per worker, released when idle: the app under test needs
// the database's connections more than the seeding does.
const pool = new Pool({
    connectionString: process.env.E2E_DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 1000,
});

export const sql = (text: string, values: unknown[] = []) =>
    pool.query(text, values);

export type SetSpec = { min: number; max: number } | { fixed: number };
export type ExerciseSpec = {
    name: string;
    sets?: SetSpec[];
    preview?: boolean;
};
export type DaySpec = { name: string; exercises?: ExerciseSpec[] };
export type RoutineSpec = {
    name: string;
    kind?: 'routine' | 'workout';
    /** null for open-ended. Defaults to 4. */
    weeks?: number | null;
    isActive?: boolean;
    isPublic?: boolean;
    cursor?: number;
    days?: DaySpec[];
};

/** A working day that passes validation: two exercises of two ranged sets. */
export const completeDay = (name: string): DaySpec => ({
    name,
    exercises: [
        {
            name: `${name} press`,
            sets: [
                { min: 6, max: 8 },
                { min: 8, max: 10 },
            ],
        },
        { name: `${name} row`, sets: [{ fixed: 10 }] },
    ],
});

export type Seeded = {
    id: string;
    name: string;
    days: {
        id: string;
        name: string;
        exercises: { id: string; name: string }[];
    }[];
};

export async function seedRoutine(
    creatorId: string,
    spec: RoutineSpec
): Promise<Seeded> {
    const kind = spec.kind ?? 'routine';
    const id = randomUUID();
    await sql(
        `insert into "Routine" ("id","name","durationWeeks","creatorId","isActive","isPublic","cursor","kind")
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
            id,
            spec.name,
            kind === 'workout'
                ? null
                : spec.weeks === undefined
                  ? 4
                  : spec.weeks,
            creatorId,
            spec.isActive ?? false,
            spec.isPublic ?? false,
            spec.cursor ?? 0,
            kind,
        ]
    );
    const days: Seeded['days'] = [];
    for (const [order, day] of (spec.days ?? []).entries()) {
        const dayId = randomUUID();
        await sql(
            `insert into "Workout" ("id","routineId","name","order") values ($1,$2,$3,$4)`,
            [dayId, id, day.name, order]
        );
        const exercises = [];
        for (const [position, exercise] of (day.exercises ?? []).entries()) {
            const exerciseId = randomUUID();
            await sql(
                `insert into "Exercise" ("id","workoutId","name","order","preview") values ($1,$2,$3,$4,$5)`,
                [
                    exerciseId,
                    dayId,
                    exercise.name,
                    position,
                    exercise.preview ?? false,
                ]
            );
            for (const [setOrder, set] of (exercise.sets ?? []).entries()) {
                const fixed = 'fixed' in set;
                await sql(
                    `insert into "ExerciseSet" ("id","exerciseId","order","repMode","repMin","repMax")
                     values ($1,$2,$3,$4,$5,$6)`,
                    [
                        randomUUID(),
                        exerciseId,
                        setOrder,
                        fixed ? 'fixed' : 'range',
                        fixed ? set.fixed : set.min,
                        fixed ? null : set.max,
                    ]
                );
            }
            exercises.push({ id: exerciseId, name: exercise.name });
        }
        days.push({ id: dayId, name: day.name, exercises });
    }
    return { id, name: spec.name, days };
}

/** A complete routine: `days` working days that pass validation. */
export const seedCompleteRoutine = (
    creatorId: string,
    name: string,
    extra: Omit<RoutineSpec, 'name' | 'days'> & { dayNames?: string[] } = {}
) =>
    seedRoutine(creatorId, {
        ...extra,
        name,
        days: (extra.dayNames ?? ['Push', 'Pull']).map(completeDay),
    });

/** A complete workout: one day under the workout's own name. */
export const seedCompleteWorkout = (
    creatorId: string,
    name: string,
    extra: Omit<RoutineSpec, 'name' | 'days' | 'kind'> = {}
) =>
    seedRoutine(creatorId, {
        ...extra,
        name,
        kind: 'workout',
        days: [completeDay(name)],
    });

export async function seedMember(routineId: string, userId: string) {
    await sql(
        `insert into "RoutineMember" ("routineId","userId") values ($1,$2)`,
        [routineId, userId]
    );
}

export async function seedFollow(followerId: string, followingId: string) {
    await sql(
        `insert into "Follow" ("followerId","followingId") values ($1,$2)`,
        [followerId, followingId]
    );
}

/** `count` made-up people following `userId`: rows only, nobody signs in. */
export async function seedFollowers(userId: string, count: number) {
    for (let i = 1; i <= count; i++) {
        const id = randomUUID();
        await sql(
            `insert into "User" ("id","name","email","updatedAt") values ($1,$2,$3,now())`,
            [id, `Fan ${String(i).padStart(2, '0')}`, `fan-${id}@example.test`]
        );
        await seedFollow(id, userId);
    }
}
