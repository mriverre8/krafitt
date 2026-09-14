/**
 * The data behind the two app screens the landing page shows. A plausible
 * fourth week of an upper/lower block: the weights are the one thing invented
 * about those screens, since the components drawing them are the app's own.
 */

import type { Translate } from '@/i18n/config';
import type { PreviousValue, SetValue, WeekState } from './progress';
import type { DemoWeek, ExerciseView, HistoryRow } from './types';

// ---------- today ----------

export const BENCH_ID = 'demo-bench';
export const DEMO_WEEK = 4;
export const DEMO_WEEKS = 8;

export function todayExercise(t: Translate): ExerciseView {
    return {
        id: BENCH_ID,
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
export const LAST_TIME: Record<number, PreviousValue | undefined> = {
    0: { week: 3, weight: 75, reps: 8 },
    1: { week: 3, weight: 70, reps: 9 },
    2: { week: 3, weight: 57.5, reps: 10 },
    3: { week: 3, weight: 46, reps: 8 },
};

/** Two of the four sets banked: the session caught halfway through, which is
    the state the screen spends most of its life in. */
export const LOGGED: Record<number, SetValue | undefined> = {
    0: { weight: 80, reps: 7 },
    1: { weight: 72.5, reps: 9 },
};

// ---------- progress ----------

/** The week the history block has reached. Everything before it is behind us —
    which is what turns week 4's blanks into "you missed this" rather than
    "not yet" — and everything after it is still ahead. */
const CURRENT = 6;

function historyRows(weeks: readonly DemoWeek[]): HistoryRow[] {
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

export function historyExercises(t: Translate) {
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
