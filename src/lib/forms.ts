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

/** Someone the member search turned up: always a person who can still be
    added, because a search that finds the owner or someone already in answers
    with a message instead. */
export type FoundUser = { id: string; name: string; image: string | null };

/**
 * What searching for someone to add answers with. `notice` rather than `error`
 * for "already in the routine": the search worked, there is simply nothing to
 * do with the answer, and `FormError` paints in danger.
 */
export type MemberSearchState = FormState & {
    found?: FoundUser;
    notice?: string;
};

/** One exercise as the database holds it. The kind is optional only so that a
    plain working set can be written without it — the database always has one.
    A null technique is a set that was never given one. */
export type SavedExercise = {
    id: string;
    name: string;
    sets: (RepSpec & KindedSet & { technique: string | null })[];
};

/**
 * What saving a day answers with: the day as it now stands, trimmed and with
 * ids handed out. The editor starts again from this rather than from its props,
 * which do not always catch up — a technique saved with nothing but spaces in
 * it leaves the stored day byte for byte as it was, so there is nothing in a
 * prop for the editor to notice.
 */
export type DayState = FormState & { saved?: SavedExercise[] };

export type DayAction = (
    previous: DayState,
    data: FormData
) => Promise<DayState>;
