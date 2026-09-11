import type { RepSpec } from './reps';
import type { KindedSet } from './sets';

/**
 * Shape returned by every form server action, consumed by useActionState.
 * A form that keeps its own state clears it on `ok`, and on `error` it holds
 * on to whatever the user typed.
 */
export type FormState = { error?: string; ok?: true };

export type FormAction = (
    previous: FormState,
    data: FormData
) => Promise<FormState>;

/** One exercise as the database holds it. The kind is optional only so that a
    plain working set can be written without it — the database always has one. */
export type SavedExercise = {
    id: string;
    name: string;
    sets: (RepSpec & KindedSet & { technique: string })[];
};

/**
 * What saving a day answers with: the day as it now stands, defaults filled in
 * and ids handed out. The editor starts again from this rather than from its
 * props, which do not always catch up — a blank technique saved as the default
 * leaves the stored day byte for byte as it was, so there is nothing in a prop
 * for the editor to notice.
 */
export type DayState = FormState & { saved?: SavedExercise[] };

export type DayAction = (
    previous: DayState,
    data: FormData
) => Promise<DayState>;
