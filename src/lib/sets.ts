/**
 * Drop and rest-pause sets. They are not a nested structure: a set of either
 * kind is an ordinary row of the exercise, sitting directly behind the working
 * set it hangs off. That is what keeps `SetLog.setIndex` — a position in this
 * very list — pointing at the same set it always did, and what lets the whole of
 * `progress.ts` stay as it is.
 *
 * Which set a drop belongs to is therefore not stored: it is the last working
 * set before it, and a run of them is the group. Pure, no Prisma, no React.
 */

import type { Translate } from '@/i18n/config';
import { DROP_PERCENT, REST_SECONDS } from './constants';

export const SET_KINDS = ['normal', 'drop', 'rest'] as const;
export type SetKind = (typeof SET_KINDS)[number];

/** The kinds a working set can be given, in the order the menu offers them. */
export const SUB_KINDS = ['drop', 'rest'] as const;
export type SubKind = (typeof SUB_KINDS)[number];

export function isSetKind(value: unknown): value is SetKind {
    return SET_KINDS.includes(value as SetKind);
}

/** All that placing a set takes — the editor's drafts qualify too, and they
    hold the amount as a string. Anything unreadable counts as a working set. */
export type Kinded = { kind?: string | null };

/** A stored set: the amount is a number by the time it is worth anything. */
export type KindedSet = Kinded & { value?: number | null };

export const setKind = (set: Kinded): SetKind =>
    isSetKind(set.kind) ? set.kind : 'normal';

/** Where a set sits: its kind, its number *within its own run* — working sets
    count 1, 2, 3 down the exercise, drops count 1, 2 inside their group — and
    the index of the working set that opens the run (its own, for one of those). */
export type SetPlace = { kind: SetKind; ordinal: number; parent: number };

export function setPlaces(sets: readonly Kinded[]): SetPlace[] {
    let working = 0;
    let inGroup = 0;
    let parent = 0;
    return sets.map((set, index) => {
        const kind = setKind(set);
        if (kind === 'normal') {
            working += 1;
            inGroup = 0;
            parent = index;
            return { kind, ordinal: working, parent: index };
        }
        inGroup += 1;
        return { kind, ordinal: inGroup, parent };
    });
}

const prefix = (kind: SetKind) => (kind === 'drop' ? 'DS' : 'RP');

/** What goes in the column where a working set shows its number: `3`, `DS`,
    `RP`. Short on purpose — it shares a row with two inputs and a button. */
export function setShortLabel(place: SetPlace): string {
    if (place.kind === 'normal') return String(place.ordinal);
    return prefix(place.kind);
}

/** The same, but numbered so that it is unique inside the exercise: `DS1`,
    `DS2`. What the field labels are worded from — two drops off one working set
    show the same `DS`, and two controls must never answer to one name. */
export function setName(place: SetPlace): string {
    if (place.kind === 'normal') return String(place.ordinal);
    return `${prefix(place.kind)}${place.ordinal}`;
}

/** The whole name, carrying the drop's per cent or the pause's seconds. This is
    what the tag above the row says, where a working set says its technique. */
export function setFullLabel(set: KindedSet, t: Translate): string {
    const kind = setKind(set);
    if (kind === 'normal') return '';
    const value = set.value;
    if (kind === 'drop') {
        return value == null ? t('set.drop') : t('set.dropWith', { value });
    }
    return value == null ? t('set.rest') : t('set.restWith', { value });
}

/**
 * The group opened by the working set at `index`: which kind it already uses —
 * null while it has none, and only one kind is ever allowed — and the position
 * the next one of them goes in, which is straight after the last it has.
 */
export function groupAt(
    sets: readonly Kinded[],
    index: number
): { kind: SubKind | null; insertAt: number } {
    let end = index + 1;
    while (end < sets.length && setKind(sets[end]) !== 'normal') end += 1;
    const first = sets[index + 1];
    const kind = end > index + 1 ? (setKind(first) as SubKind) : null;
    return { kind, insertAt: end };
}

const limits = { drop: DROP_PERCENT, rest: REST_SECONDS };

/**
 * Whether the per cent or the pause is still holding the routine back. The
 * pause is the set's whole point, so a rest-pause without one is unfinished; a
 * drop without a per cent is just a drop the user has not sized, which trains
 * fine. Same shape as `badRepFields`: the editor paints exactly this field.
 */
export function badSetValue(set: KindedSet): boolean {
    const kind = setKind(set);
    if (kind !== 'rest') return false;
    const { value } = set;
    return (
        value == null ||
        !Number.isInteger(value) ||
        value < limits.rest.min ||
        value > limits.rest.max
    );
}

/** The per cent or the pause, read off a form field. `null` is a blank one,
    `undefined` a number the form should never have been able to produce. */
export function readSetValue(
    raw: unknown,
    kind: SetKind
): number | null | undefined {
    if (kind === 'normal') return null;
    if (raw === '' || raw === null || raw === undefined) return null;
    const value = Number.parseInt(String(raw), 10);
    const limit = limits[kind];
    if (!Number.isInteger(value) || value < limit.min || value > limit.max) {
        return undefined;
    }
    return value;
}
