import type { Translate } from '@/i18n/config';
import { EXERCISES, SETS, WEEKS as WEEK_LIMIT } from '@/lib/constants';
import type { PreviousValue, SetValue, WeekState } from '@/lib/progress';
import { ChevronsDown, Repeat, Tag } from 'lucide-react';
import type { ComponentType } from 'react';
import type { HistoryRow } from '@/components/history/history-exercise';
import type { ExerciseView } from '@/components/workout/workout-exercise';

// ---------- page ----------

export type Icon = ComponentType<{ size?: number; className?: string }>;

export const CHIPS = [
    'landing.chip1',
    'landing.chip2',
    'landing.chip3',
] as const;


export type Spec = {
    stat?: number;
    Icon?: Icon;
    title: string;
    body: string;
    chips?: readonly string[];
};

export function editorSpecs(t: Translate): readonly Spec[] {
    return [
        {
            stat: WEEK_LIMIT.max,
            title: t('landing.spec1Title', { n: WEEK_LIMIT.max }),
            body: t('landing.spec1Body'),
        },
        {
            stat: EXERCISES.max,
            title: t('landing.spec2Title', { n: EXERCISES.max }),
            body: t('landing.spec2Body'),
        },
        {
            stat: SETS.max,
            title: t('landing.spec3Title', { n: SETS.max }),
            body: t('landing.spec3Body'),
        },
        {
            Icon: Repeat,
            title: t('landing.spec4Title'),
            body: t('landing.spec4Body'),
            chips: [
                t('today.setPlan', { min: 8, max: 10 }),
                t('today.setPlanFixed', { reps: 10 }),
                t('reps.amrap'),
            ],
        },
        {
            Icon: Tag,
            title: t('landing.spec5Title'),
            body: t('landing.spec5Body'),
            chips: [
                t('technique.warmup'),
                t('technique.topset'),
                t('technique.backoff'),
                t('technique.linear'),
            ],
        },
        {
            Icon: ChevronsDown,
            title: t('landing.spec6Title'),
            body: t('landing.spec6Body'),
            chips: [
                t('set.dropWith', { value: 20 }),
                t('set.restWith', { value: 15 }),
            ],
        },
    ];
}

// ---------- today ----------

export const BENCH = 'demo-bench';
export const WEEK = 4;
export const WEEKS = 8;

export function todayExercise(t: Translate): ExerciseView {
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

export const LAST_TIME: Record<number, PreviousValue | undefined> = {
    0: { week: 3, weight: 75, reps: 8 },
    1: { week: 3, weight: 70, reps: 9 },
    2: { week: 3, weight: 57.5, reps: 10 },
    3: { week: 3, weight: 46, reps: 8 },
};

export const LOGGED: Record<number, SetValue | undefined> = {
    0: { weight: 80, reps: 7 },
    1: { weight: 72.5, reps: 9 },
};

// ---------- progress ----------

type Week = readonly (readonly [number, number])[] | null;

const CURRENT = 6;

export function historyRows(weeks: readonly Week[]): HistoryRow[] {
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
