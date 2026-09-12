'use client';

/**
 * The two app screens the landing page shows, as the actual components rather
 * than pictures of them: `WorkoutExercise` and `HistoryExercise`, the same ones
 * the signed-in app renders. Nothing here is a mock-up, so nothing here can
 * drift away from the product it is advertising.
 *
 * The training screen is a still — handed a half-logged session with the whole
 * block inert, so it reads as a photograph of the app mid-workout. The history
 * grid takes input, because paging between exercises is the thing worth
 * feeling. The data is a plausible fourth week of an upper/lower block: the
 * weights are the one thing invented, the behaviour is the app's own.
 */

import { useState } from 'react';
import type { Translate } from '@/i18n/config';
import { useT } from '@/i18n/use-t';
import {
    isSetEnabled,
    type PreviousValue,
    type SetValue,
    type WeekState,
} from '@/lib/progress';
import { ProgressLadder } from '@/components/ui/progress-ladder';
import {
    WorkoutExercise,
    type ExerciseView,
} from '@/components/workout/workout-exercise';
import {
    HistoryExercise,
    type HistoryRow,
} from '@/components/history/history-exercise';

// ---------- today ----------

const BENCH = 'demo-bench';
const WEEK = 4;
const WEEKS = 8;

function todayExercise(t: Translate): ExerciseView {
    return {
        id: BENCH,
        name: t('landing.exBench'),
        sets: [
            {
                kind: 'normal',
                repMode: 'range',
                repMin: 6,
                repMax: 8,
                value: null,
                technique: t('technique.topset'),
            },
            {
                kind: 'normal',
                repMode: 'range',
                repMin: 8,
                repMax: 10,
                value: null,
                technique: t('technique.backoff'),
            },
            {
                kind: 'normal',
                repMode: 'range',
                repMin: 10,
                repMax: 12,
                value: null,
                technique: t('technique.linear'),
            },
            {
                kind: 'drop',
                repMode: 'amrap',
                repMin: null,
                repMax: null,
                value: 20,
                technique: '',
            },
        ],
    };
}

/** What week 3 left behind, which is what sits beside each field. */
const LAST_TIME: Record<number, PreviousValue | undefined> = {
    0: { week: 3, weight: 75, reps: 8 },
    1: { week: 3, weight: 70, reps: 9 },
    2: { week: 3, weight: 57.5, reps: 10 },
    3: { week: 3, weight: 46, reps: 8 },
};

/** Two of the four sets banked: the session caught halfway through, which is
    the state the screen spends most of its life in. */
const LOGGED: Record<number, SetValue | undefined> = {
    0: { weight: 80, reps: 7 },
    1: { weight: 72.5, reps: 9 },
};

/**
 * The training screen, standing still. It is the app's own component handed a
 * half-logged session, with every set locked — a photograph rather than a toy:
 * two sets banked and green, the rest waiting, the ladder half full.
 */
export function TodayPreview() {
    const t = useT();

    const exercise = todayExercise(t);
    const done = Object.keys(LOGGED).length;
    const total = exercise.sets.length;
    const progress = t('today.progress', { done, total });
    const store = { [BENCH]: LOGGED };

    return (
        <div className="space-y-4">
            <header className="border-line border-l-volt bg-surface space-y-5 rounded-md border border-l-[6px] p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="eyebrow text-muted truncate">
                            {t('landing.demoRoutine')}
                        </p>
                        <p className="display text-ink mt-2 text-5xl sm:text-6xl">
                            {t('landing.day1')}
                        </p>
                    </div>
                    <p className="bg-volt text-on-volt figure grid shrink-0 place-items-center rounded-md px-3 py-2 leading-none">
                        <span className="sr-only">
                            {t('today.week', { week: WEEK, total: WEEKS })}
                        </span>
                        <span
                            aria-hidden
                            className="text-4xl"
                        >
                            {WEEK}
                        </span>
                        <span
                            aria-hidden
                            className="eyebrow mt-1 opacity-70"
                        >
                            / {WEEKS}
                        </span>
                    </p>
                </div>

                <div className="space-y-2">
                    <ProgressLadder
                        done={done}
                        total={total}
                        label={progress}
                    />
                    <p className="figure text-muted text-sm">{progress}</p>
                </div>
            </header>

            <div inert>
                <WorkoutExercise
                    exercise={exercise}
                    logs={LOGGED}
                    previous={LAST_TIME}
                    isSetEnabled={(setIndex) =>
                        isSetEnabled([exercise], store, BENCH, setIndex)
                    }
                    onSaveSet={() => {}}
                />
            </div>
        </div>
    );
}

// ---------- progress ----------

/** `null` is a week that was never trained. */
type Week = readonly (readonly [number, number])[] | null;

/** The week the history block has reached. Everything before it is behind us —
    which is what turns week 4's blanks into "you missed this" rather than
    "not yet" — and everything after it is still ahead. */
const CURRENT = 6;

function historyRows(weeks: readonly Week[]): HistoryRow[] {
    return weeks.map((logged, i) => {
        const sets: Record<number, SetValue | undefined> = {};
        logged?.forEach(([weight, reps], setIndex) => {
            sets[setIndex] = { weight, reps };
        });
        const week = i + 1;
        const state: WeekState =
            week < CURRENT ? 'past' : week === CURRENT ? 'current' : 'upcoming';
        return { week, state, sets };
    });
}

function historyExercises(t: Translate) {
    return [
        {
            exercise: {
                id: 'history-bench',
                name: t('landing.exBench'),
                sets: [
                    {
                        kind: 'normal',
                        repMode: 'range',
                        repMin: 6,
                        repMax: 8,
                        value: null,
                        technique: t('technique.topset'),
                    },
                    {
                        kind: 'normal',
                        repMode: 'range',
                        repMin: 8,
                        repMax: 10,
                        value: null,
                        technique: t('technique.backoff'),
                    },
                    {
                        kind: 'normal',
                        repMode: 'range',
                        repMin: 10,
                        repMax: 12,
                        value: null,
                        technique: t('technique.linear'),
                    },
                    {
                        kind: 'drop',
                        repMode: 'amrap',
                        repMin: null,
                        repMax: null,
                        value: 20,
                        technique: '',
                    },
                ],
            } satisfies ExerciseView,
            rows: historyRows([
                [
                    [70, 8],
                    [65, 9],
                    [55, 11],
                    [44, 9],
                ],
                [
                    [72.5, 8],
                    [67.5, 9],
                    [57.5, 11],
                    [46, 9],
                ],
                [
                    [75, 8],
                    [70, 9],
                    [57.5, 10],
                    [46, 8],
                ],
                null,
                [
                    [77.5, 7],
                    [72.5, 8],
                    [60, 11],
                    [48, 9],
                ],
                [
                    [80, 6],
                    [75, 8],
                    [62.5, 10],
                    [50, 8],
                ],
                null,
                null,
            ]),
        },
        {
            exercise: {
                id: 'history-squat',
                name: t('landing.exSquat'),
                sets: [
                    {
                        kind: 'normal',
                        repMode: 'range',
                        repMin: 5,
                        repMax: 8,
                        value: null,
                        technique: t('technique.topset'),
                    },
                    {
                        kind: 'normal',
                        repMode: 'range',
                        repMin: 8,
                        repMax: 10,
                        value: null,
                        technique: t('technique.backoff'),
                    },
                    {
                        kind: 'rest',
                        repMode: 'amrap',
                        repMin: null,
                        repMax: null,
                        value: 15,
                        technique: '',
                    },
                ],
            } satisfies ExerciseView,
            rows: historyRows([
                [
                    [100, 6],
                    [85, 9],
                    [60, 8],
                ],
                [
                    [102.5, 6],
                    [87.5, 9],
                    [62.5, 8],
                ],
                [
                    [105, 6],
                    [90, 8],
                    [62.5, 7],
                ],
                null,
                [
                    [107.5, 6],
                    [92.5, 9],
                    [65, 8],
                ],
                [
                    [110, 5],
                    [95, 8],
                    [67.5, 8],
                ],
                null,
                null,
            ]),
        },
    ];
}

/** The history grid, with the arrows working: every cell is judged against the
    last week that same set was logged, skipped weeks and all. */
export function ProgressDemo() {
    const t = useT();
    const [position, setPosition] = useState(0);
    const entries = historyExercises(t);
    const entry = entries[position];

    return (
        <HistoryExercise
            exercise={entry.exercise}
            rows={entry.rows}
            position={position}
            total={entries.length}
            onSelect={setPosition}
        />
    );
}
