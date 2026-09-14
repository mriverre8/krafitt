/**
 * The shapes the components pass between themselves.
 *
 * A component file holds the component and its own props; anything a second
 * file also has to name lives here instead, so a type is never imported from
 * the middle of a `.tsx`.
 *
 * The domain types stay where the logic that produces them is — `lib/progress`,
 * `lib/sets`, `lib/reps`, `lib/validate`, `lib/forms` — and this file builds on
 * them rather than restating them.
 */

import type { ComponentType } from 'react';
import type { SavedExercise } from './forms';
import type { Logs, SetValue, WeekState } from './progress';
import type { RepMode } from './reps';
import type { SetKind } from './sets';
import type { ExerciseFault } from './validate';

/** One exercise as every screen that only reads it sees it. */
export type ExerciseView = SavedExercise;

// ---------- the exercise editor ----------

export type SetDraft = {
    kind: SetKind;
    mode: RepMode;
    repMin: string;
    repMax: string;
    /** Per cent for a drop, seconds for a rest-pause; blank for a working set. */
    value: string;
    technique: string;
};

/** `id` is null until the exercise has been saved for the first time. */
export type ExerciseDraft = {
    id: string | null;
    name: string;
    sets: SetDraft[];
};

// ---------- a routine's days ----------

export type DayTab = {
    id: string;
    name: string;
    ready: boolean;
    /** Edited and not saved yet, so `ready` describes a day that no longer
        exists anywhere but the draft. */
    unsaved: boolean;
};

export type RoutineDay = {
    id: string;
    name: string;
    exercises: ExerciseView[];
    /** What this day is still missing, as last saved. */
    problems: string[];
    /** The same holes as fields to paint, by exercise id. */
    faults: Record<string, ExerciseFault>;
};

/**
 * A routine opens read-only: every field is locked and everything that changes
 * it is out of sight until Edit is pressed.
 *
 * Leaving edit mode throws the unsaved drafts away, so what is on screen in
 * read mode is what the database holds and nothing else. The days keep their
 * own drafts — the context only holds which ones are dirty, so the toggle knows
 * whether to ask first and the rack of days can mark them, and bumps
 * `discarded` to tell them all to start over.
 */
export type EditMode = {
    editing: boolean;
    toggle: () => void;
    /** Rises by one each time the drafts are thrown away. */
    discarded: number;
    /** Days edited since their last save, by id. */
    dirtyDays: ReadonlySet<string>;
    /** Called by each day as its draft moves away from, or back to, the last
        save. */
    setDirty: (id: string, dirty: boolean) => void;
};

// ---------- history ----------

export type HistoryRow = {
    week: number;
    state: WeekState;
    /** What this exercise was given that week, by set index. */
    sets: Record<number, SetValue | undefined>;
};

export type HistoryDay = {
    id: string;
    name: string;
    exercises: ExerciseView[];
    /** What was logged on this day, by week. A week nobody trained is absent. */
    weeks: Record<number, Logs>;
};

export type WeekRow = { week: number; state: WeekState; logs: Logs };

// ---------- the signed-out home page ----------

export type Icon = ComponentType<{ size?: number; className?: string }>;

/** A card of the editor spec: either a hard limit, shown as the number itself,
    or a choice, shown as the options it actually offers. */
export type Spec = {
    /** The limit, as a volt plate. Numbers come from `lib/constants.ts`, so a
        card can never outlive the rule it is quoting. */
    stat?: number;
    Icon?: Icon;
    title: string;
    body: string;
    /** Worded from the app's own dictionary, so the examples on the card are
        literally the strings the editor writes. */
    chips?: readonly string[];
};

/** One week of a demo block. `null` is a week that was never trained. */
export type DemoWeek = readonly (readonly [number, number])[] | null;

/** Which half of the auth card is on screen. */
export type AuthMode = 'login' | 'signup';
