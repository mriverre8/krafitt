'use client';

import { useT } from '@/i18n/use-t';
import {
    DROP_PERCENT,
    NAME_MAX,
    REPS,
    REST_SECONDS,
    SETS,
    USER_NAME_MAX,
} from '@/lib/constants';
import { hasNoReps, isRepMode, REP_MODES, type RepMode } from '@/lib/reps';
import {
    groupAt,
    setKind,
    setName,
    setPlaces,
    setShortLabel,
    SUB_KINDS,
    type SetKind,
    type SubKind,
} from '@/lib/sets';
import type { ExerciseFault } from '@/lib/validate';
import {
    cardClass,
    fieldClass,
    labelClass,
    menuDangerClass,
    removeButtonClass,
    titleInputClass,
    wrongFieldClass,
    wrongTitleInputClass,
} from '@/lib/ui';
import { Pencil, Plus, Type, X } from 'lucide-react';
import { Dropdown } from '@/components/ui/dropdown';
import type { ExerciseView } from '@/components/workout/workout-exercise';

export type SetDraft = {
    kind: SetKind;
    mode: RepMode;
    repMin: string;
    repMax: string;
    /** Per cent for a drop, seconds for a rest-pause; blank for a working set. */
    value: string;
    /** Null until the set is given one. Blank is a technique that was added and
        has yet to be named, which is a hole in the routine rather than none. */
    technique: string | null;
};

/** `id` is null until the exercise has been saved for the first time. */
export type ExerciseDraft = {
    id: string | null;
    name: string;
    sets: SetDraft[];
};

export const emptySet: SetDraft = {
    kind: 'normal',
    mode: 'range',
    repMin: '',
    repMax: '',
    value: '',
    technique: null,
};

export const emptyExercise: ExerciseDraft = {
    id: null,
    name: '',
    sets: [emptySet],
};

/**
 * The day always shows at least one exercise, the same way an exercise always
 * shows at least one set. Key order matters: the drafts are compared and
 * submitted as JSON.
 */
export function toDrafts(exercises: ExerciseView[]): ExerciseDraft[] {
    if (exercises.length === 0) return [emptyExercise];
    return exercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        sets: exercise.sets.map((set) => ({
            kind: setKind(set),
            mode: isRepMode(set.repMode) ? set.repMode : 'range',
            repMin: set.repMin?.toString() ?? '',
            repMax: set.repMax?.toString() ?? '',
            value: set.value?.toString() ?? '',
            technique: set.technique,
        })),
    }));
}

const rowFieldClass = 'h-12';

/** How a number box looks. How it takes its width is left to the caller: the
    reps share out their slot, the drop or rest-pause value takes the line. */
const numberClass = (wrong: boolean) =>
    `${wrong ? wrongFieldClass : fieldClass} ${rowFieldClass} min-w-0 ` +
    `px-1 text-center md:px-3`;

const noFault = { min: false, max: false, value: false, technique: false };

/** The reps are one column from md up, whatever the mode puts in it: two boxes
    for a range, one wide box for a fixed count, a dash for AMRAP. The width is
    held so the technique column lines up across rows, and a field the mode does
    not need is gone rather than an invisible box leaving a hole.

    On a phone a working set has the line to itself and its reps take the rest
    of it. A drop or rest-pause set shares that line with its own value, so
    there the reps take everything the fixed value box leaves: same width on
    every one of those rows, and the line ends flush on any screen.

    `min-w-0` is what makes that second case work. A flex item's automatic
    minimum is its content, and for a box holding `<input>`s that is their
    intrinsic ~170px each — so a range would blow the row open and push the
    value onto a line of its own however little the reps were given. */
const repsSlotClass = (sub: boolean) =>
    sub
        ? 'flex min-w-0 flex-1 gap-1.5 md:w-48 md:flex-none md:gap-2'
        : 'contents md:flex md:w-48 md:shrink-0 md:gap-2';

/** Joins the two boxes of a range, so the pair reads as one prescription
    instead of two loose numbers. */
const rangeJoinClass = 'text-muted shrink-0 self-center text-sm';

/** A row action worded rather than drawn: adding a drop set has no icon anyone
    would read, so these say what they do. */
const rowButtonClass = `${labelClass} flex items-center gap-1.5 py-1 transition-colors disabled:opacity-30`;

const menuItemClass =
    'flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface2 hover:text-pulse';

/** The techniques the menu offers before Custom, in the order it offers them:
    a warm-up opens the exercise, so it opens the list too. */
const TECHNIQUES = ['warmup', 'linear', 'topset', 'backoff'] as const;

/** Stands in for a field that is not there yet, the way the dashed card at the
    foot of the day stands in for an exercise. Its size comes from the caller:
    it has to take up exactly what the field it stands in for would. */
const addFieldClass =
    'lift flex items-center justify-center gap-2 rounded-md border-2 ' +
    'border-dashed border-line font-display text-sm font-bold tracking-wide uppercase ' +
    'text-muted transition-colors hover:border-pulse hover:text-pulse';

/** The column a drop or rest-pause set puts its own amount in. Wider than the
    number needs from md up, where the drop's menu says what it would add. */
const valueSlotClass = 'w-16 shrink-0 md:w-32';

/** The per cents the drop menu offers. Round, and well inside DROP_PERCENT: a
    drop is sized by feel, and the odd numbers are not worth a keyboard. */
const DROP_VALUES = [10, 20, 30, 40, 50];

const valueLimits = { drop: DROP_PERCENT, rest: REST_SECONDS, normal: REPS };

/**
 * One exercise of the day, in a card of its own. Holds no state: the whole day
 * is a single form, and its draft lives in the editor above so one Save covers
 * all of them. Every field can be left blank — the routine is validated as a
 * whole before it can be activated.
 *
 * A drop or rest-pause set is a row of this same list, inserted behind the
 * working set it hangs off rather than nested inside it (see `lib/sets.ts`).
 * One working set takes one kind or the other, never both: once it has one, the
 * menu is gone and the button names the kind it will add another of.
 */
export function ExerciseFields({
    exercise,
    index,
    fault,
    readOnly,
    onChange,
    onRemove,
    canRemove,
}: {
    exercise: ExerciseDraft;
    index: number;
    /** The fields to paint red, or nothing while the eye is off. Comes from the
        day's own errors, so it never flags something only the draft knows. */
    fault?: ExerciseFault;
    /** The routine is being read, not edited: the fields are locked and the
        buttons that add or drop rows are gone. */
    readOnly?: boolean;
    onChange: (patch: Partial<ExerciseDraft>) => void;
    onRemove: () => void;
    canRemove: boolean;
}) {
    const t = useT();
    // Labels carry the exercise number too: a day holds several of these, and
    // "Min reps set 1" on its own would name four different inputs.
    const e = index + 1;
    const places = setPlaces(exercise.sets);
    const full = exercise.sets.length >= SETS.max;
    // What the menu offers. A set showing one of these was picked rather than
    // typed, so its field is read-only: Custom is the way to write your own.
    const presets: string[] = TECHNIQUES.map((key) => t(`technique.${key}`));

    function updateSet(setIndex: number, patch: Partial<SetDraft>) {
        onChange({
            sets: exercise.sets.map((set, i) =>
                i === setIndex ? { ...set, ...patch } : set
            ),
        });
    }

    /**
     * `count` is the whole group: a drop set is defined by the working set in
     * front of it, so dropping that set takes its run with it. Leaving them
     * behind would hang them off whatever ended up above instead — and a run
     * left at the top of the exercise has no working set at all, which is the
     * one shape `readPlan` refuses outright.
     */
    function removeSet(setIndex: number, count: number) {
        onChange({
            sets: exercise.sets.filter(
                (_, i) => i < setIndex || i >= setIndex + count
            ),
        });
    }

    /** A drop or rest-pause set lands directly behind the working set it hangs
        off, after any it already has, so the group stays one run of rows. */
    function addSub(setIndex: number, kind: SubKind) {
        const sets = [...exercise.sets];
        sets.splice(groupAt(sets, setIndex).insertAt, 0, { ...emptySet, kind });
        onChange({ sets });
    }

    // Anything at all wrong with this exercise, so the card's left rule — the
    // app's one ornament — can say so without repeating which field it is.
    const wrongAnywhere =
        !!fault &&
        (fault.name ||
            fault.sets.some(
                (set) => set.min || set.max || set.value || set.technique
            ));

    return (
        <div
            className={`${cardClass} space-y-3 ${
                wrongAnywhere ? 'border-l-danger' : ''
            }`}
        >
            <input
                value={exercise.name}
                readOnly={readOnly}
                onChange={(event) => onChange({ name: event.target.value })}
                aria-label={t('exercise.nameLabel', { e })}
                placeholder={t('exercise.namePlaceholder')}
                maxLength={NAME_MAX}
                className={`${
                    fault?.name ? wrongTitleInputClass : titleInputClass
                } display text-2xl`}
            />

            <div>
                {exercise.sets.map((set, setIndex) => {
                    const wrong = fault?.sets[setIndex] ?? noFault;
                    const place = places[setIndex];
                    const sub = place.kind !== 'normal';
                    const n = setName(place);
                    const limit = valueLimits[place.kind];

                    const group = sub ? null : groupAt(exercise.sets, setIndex);
                    const count = group ? group.insertAt - setIndex : 1;
                    const canRemoveSet = exercise.sets.length > count;

                    /** The × beside the fields. From md up only a drop or
                        rest-pause set still wears one: a numbered set drops its
                        row from the bar of actions under it instead. */
                    const removeButton = !readOnly && (
                        <button
                            type="button"
                            disabled={!canRemoveSet}
                            onClick={() => removeSet(setIndex, count)}
                            aria-label={t('exercise.removeSet', { e, n })}
                            className={removeButtonClass}
                        >
                            <X
                                size={14}
                                aria-hidden
                            />
                        </button>
                    );

                    /** The same, worded: the phone's own row action, and the
                        numbered set's from md up. */
                    const removeSetButton = !readOnly && (
                        <button
                            type="button"
                            disabled={!canRemoveSet}
                            onClick={() => removeSet(setIndex, count)}
                            aria-label={t('exercise.removeSet', { e, n })}
                            className={`${rowButtonClass} hover:text-danger`}
                        >
                            <X
                                size={14}
                                aria-hidden
                            />
                            {t('exercise.removeSetShort')}
                        </button>
                    );

                    /** A drop that was never given a per cent, while the routine
                        is being read. It has nothing to say, so it says nothing:
                        the field is gone rather than standing there empty. */
                    const blankDrop =
                        readOnly && place.kind === 'drop' && !set.value;

                    /** The amount as the routine is read rather than written:
                        a drop is a cut, a pause is a length of time, and both
                        say which right there in the box. A pause that was never
                        given one stays blank — that is a hole to be filled. */
                    const readValue = !set.value
                        ? ''
                        : place.kind === 'drop'
                          ? `−${set.value}${t('set.dropUnit')}`
                          : `${set.value}${t('set.restSymbol')}`;

                    // Null is a set with no technique; the menu hands it one,
                    // and Custom hands it a blank field to write its own in.
                    const technique = set.technique;
                    const removeTechnique = () =>
                        updateSet(setIndex, { technique: null });
                    const techniqueMenu = (close: () => void) => (
                        <>
                            {presets.map((preset) => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => {
                                        updateSet(setIndex, {
                                            technique: preset,
                                        });
                                        close();
                                    }}
                                    className={menuItemClass}
                                >
                                    {preset}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => {
                                    updateSet(setIndex, { technique: '' });
                                    close();
                                }}
                                className={menuItemClass}
                            >
                                <Type
                                    size={14}
                                    aria-hidden
                                />
                                {t('technique.custom')}
                            </button>
                            {technique !== null && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        removeTechnique();
                                        close();
                                    }}
                                    className={menuDangerClass}
                                >
                                    <X
                                        size={14}
                                        aria-hidden
                                    />
                                    {t('exercise.removeTechnique')}
                                </button>
                            )}
                        </>
                    );

                    /** The menu, worn as whatever the screen it opens on asks
                        for: a field-shaped placeholder on a phone, a row action
                        beside the drop / rest-pause one from md up. It adds a
                        technique while the set has none and edits the one it
                        has after that, the menu itself being the same either
                        way — swapping a technique is picking another one. */
                    const techniqueDropdown = (className: string) => (
                        <Dropdown
                            label={t(
                                technique === null
                                    ? 'exercise.addTechniqueLabel'
                                    : 'exercise.editTechniqueLabel',
                                { e, n }
                            )}
                            className={className}
                            align="left"
                            icon={
                                <>
                                    {technique === null ? (
                                        <Plus
                                            size={14}
                                            aria-hidden
                                        />
                                    ) : (
                                        <Pencil
                                            size={14}
                                            aria-hidden
                                        />
                                    )}
                                    {t(
                                        technique === null
                                            ? 'exercise.addTechnique'
                                            : 'exercise.editTechnique'
                                    )}
                                </>
                            }
                        >
                            {techniqueMenu}
                        </Dropdown>
                    );

                    // Beside the drop / rest-pause button, from md up.
                    const techniqueButton =
                        readOnly || sub
                            ? null
                            : techniqueDropdown(
                                  `${rowButtonClass} hover:text-pulse`
                              );

                    const taken = group?.kind ?? null;
                    const addButton =
                        readOnly || sub || full ? null : taken ? (
                            <button
                                type="button"
                                onClick={() => addSub(setIndex, taken)}
                                className={`${rowButtonClass} hover:text-pulse`}
                            >
                                <Plus
                                    size={14}
                                    aria-hidden
                                />
                                {t(
                                    taken === 'drop'
                                        ? 'exercise.addDrop'
                                        : 'exercise.addRest'
                                )}
                            </button>
                        ) : (
                            <Dropdown
                                label={t('exercise.addSubLabel', { n })}
                                className={`${rowButtonClass} hover:text-pulse`}
                                align="left"
                                icon={
                                    <>
                                        <Plus
                                            size={14}
                                            aria-hidden
                                        />
                                        {t('exercise.addSub')}
                                    </>
                                }
                            >
                                {(close) =>
                                    SUB_KINDS.map((kind) => (
                                        <button
                                            key={kind}
                                            type="button"
                                            onClick={() => {
                                                addSub(setIndex, kind);
                                                close();
                                            }}
                                            className={menuItemClass}
                                        >
                                            <Plus
                                                size={14}
                                                aria-hidden
                                            />
                                            {t(
                                                kind === 'drop'
                                                    ? 'exercise.addDrop'
                                                    : 'exercise.addRest'
                                            )}
                                        </button>
                                    ))
                                }
                            </Dropdown>
                        );

                    return (
                        <div
                            key={setIndex}
                            className={`space-y-1.5 ${
                                sub
                                    ? 'mt-2 md:mt-0'
                                    : setIndex > 0
                                      ? 'mt-7'
                                      : ''
                            }`}
                        >
                            {(addButton || techniqueButton) && (
                                <div className="hidden items-center gap-5 pl-14 md:flex">
                                    {addButton}
                                    {techniqueButton}
                                    {!sub && removeSetButton}
                                </div>
                            )}
                            <div
                                className={`space-y-1.5 transition-colors md:border-l-4 md:pl-3 ${
                                    sub ? 'md:pt-2' : ''
                                } ${
                                    wrong.min ||
                                    wrong.max ||
                                    wrong.value ||
                                    wrong.technique
                                        ? 'border-danger'
                                        : 'border-line'
                                }`}
                            >
                                <div className="flex items-center gap-2 md:hidden">
                                    <p
                                        aria-hidden
                                        className="eyebrow text-pulse"
                                    >
                                        {sub
                                            ? `${t('today.set', {
                                                  n: setShortLabel(
                                                      places[place.parent]
                                                  ),
                                              })} · ${t(
                                                  place.kind === 'drop'
                                                      ? 'set.drop'
                                                      : 'set.rest'
                                              )}`
                                            : t('today.set', { n })}
                                    </p>
                                    {addButton}
                                    <span className="ml-auto">
                                        {removeSetButton}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                                    <span
                                        aria-hidden
                                        className={`figure hidden w-8 shrink-0 md:block ${
                                            sub
                                                ? 'text-muted text-sm'
                                                : 'text-ink text-lg font-bold'
                                        }`}
                                    >
                                        {setShortLabel(place)}
                                    </span>
                                    <select
                                        value={set.mode}
                                        tabIndex={readOnly ? -1 : undefined}
                                        aria-readonly={readOnly}
                                        onChange={(event) =>
                                            updateSet(setIndex, {
                                                mode: event.target
                                                    .value as RepMode,
                                            })
                                        }
                                        aria-label={t('exercise.repMode', {
                                            e,
                                            n,
                                        })}
                                        className={`${fieldClass} ${rowFieldClass} w-24 shrink-0 px-2 md:w-28 md:px-3 ${
                                            readOnly
                                                ? 'pointer-events-none'
                                                : ''
                                        }`}
                                    >
                                        {REP_MODES.map((mode) => (
                                            <option
                                                key={mode}
                                                value={mode}
                                            >
                                                {t(`reps.${mode}`)}
                                            </option>
                                        ))}
                                    </select>
                                    <div className={repsSlotClass(sub)}>
                                        {hasNoReps(set.mode) ? (
                                            <span
                                                aria-hidden
                                                className={`${rowFieldClass} text-muted flex flex-1 items-center justify-center`}
                                            >
                                                —
                                            </span>
                                        ) : (
                                            <>
                                                <input
                                                    type="number"
                                                    inputMode="numeric"
                                                    min={REPS.min}
                                                    max={REPS.max}
                                                    value={set.repMin}
                                                    readOnly={readOnly}
                                                    onChange={(event) =>
                                                        updateSet(setIndex, {
                                                            repMin: event.target.value.slice(
                                                                0,
                                                                REPS.digits
                                                            ),
                                                        })
                                                    }
                                                    placeholder={t(
                                                        'today.reps'
                                                    )}
                                                    aria-label={t(
                                                        'exercise.repMin',
                                                        { e, n }
                                                    )}
                                                    className={`${numberClass(
                                                        wrong.min
                                                    )} flex-1`}
                                                />
                                                {set.mode === 'range' && (
                                                    <>
                                                        <span
                                                            aria-hidden
                                                            className={
                                                                rangeJoinClass
                                                            }
                                                        >
                                                            {t('reps.to')}
                                                        </span>
                                                        <input
                                                            type="number"
                                                            inputMode="numeric"
                                                            min={REPS.min}
                                                            max={REPS.max}
                                                            value={set.repMax}
                                                            readOnly={readOnly}
                                                            onChange={(event) =>
                                                                updateSet(
                                                                    setIndex,
                                                                    {
                                                                        repMax: event.target.value.slice(
                                                                            0,
                                                                            REPS.digits
                                                                        ),
                                                                    }
                                                                )
                                                            }
                                                            placeholder={t(
                                                                'today.reps'
                                                            )}
                                                            aria-label={t(
                                                                'exercise.repMax',
                                                                { e, n }
                                                            )}
                                                            className={`${numberClass(
                                                                wrong.max
                                                            )} flex-1`}
                                                        />
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    {sub && !readOnly && (
                                        <div className="hidden md:order-last md:block">
                                            {removeButton}
                                        </div>
                                    )}
                                    {sub &&
                                    place.kind === 'drop' &&
                                    !readOnly ? (
                                        <Dropdown
                                            label={t('exercise.setValue', {
                                                e,
                                                label: n,
                                            })}
                                            className={
                                                set.value
                                                    ? `${numberClass(false)} ${valueSlotClass}`
                                                    : `${addFieldClass} ${rowFieldClass} ${valueSlotClass} px-1`
                                            }
                                            icon={
                                                set.value ? (
                                                    `${set.value}${t('set.dropUnit')}`
                                                ) : (
                                                    <>
                                                        <Plus
                                                            size={14}
                                                            aria-hidden
                                                        />
                                                        <span className="hidden md:inline">
                                                            {t(
                                                                'exercise.addDropValue'
                                                            )}
                                                        </span>
                                                        <span className="md:hidden">
                                                            {t('set.dropUnit')}
                                                        </span>
                                                    </>
                                                )
                                            }
                                        >
                                            {(close) => (
                                                <>
                                                    {DROP_VALUES.map(
                                                        (percent) => (
                                                            <button
                                                                key={percent}
                                                                type="button"
                                                                onClick={() => {
                                                                    updateSet(
                                                                        setIndex,
                                                                        {
                                                                            value: String(
                                                                                percent
                                                                            ),
                                                                        }
                                                                    );
                                                                    close();
                                                                }}
                                                                className={
                                                                    menuItemClass
                                                                }
                                                            >
                                                                {`${percent}${t('set.dropUnit')}`}
                                                            </button>
                                                        )
                                                    )}
                                                    {set.value !== '' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                updateSet(
                                                                    setIndex,
                                                                    {
                                                                        value: '',
                                                                    }
                                                                );
                                                                close();
                                                            }}
                                                            className={
                                                                menuItemClass
                                                            }
                                                        >
                                                            {t(
                                                                'exercise.noDropValue'
                                                            )}
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </Dropdown>
                                    ) : sub && readOnly ? (
                                        blankDrop ? null : (
                                            <input
                                                type="text"
                                                readOnly
                                                value={readValue}
                                                placeholder={t('set.restUnit')}
                                                aria-label={t(
                                                    'exercise.setValue',
                                                    { e, label: n }
                                                )}
                                                className={`${numberClass(
                                                    wrong.value
                                                )} ${valueSlotClass}`}
                                            />
                                        )
                                    ) : sub ? (
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            min={limit.min}
                                            max={limit.max}
                                            value={set.value}
                                            onChange={(event) =>
                                                updateSet(setIndex, {
                                                    value: event.target.value.slice(
                                                        0,
                                                        limit.digits
                                                    ),
                                                })
                                            }
                                            placeholder={t(
                                                place.kind === 'drop'
                                                    ? 'set.dropUnit'
                                                    : 'set.restUnit'
                                            )}
                                            aria-label={t('exercise.setValue', {
                                                e,
                                                label: n,
                                            })}
                                            className={`${numberClass(
                                                wrong.value
                                            )} ${valueSlotClass}`}
                                        />
                                    ) : technique !== null ? (
                                        <div className="relative min-w-40 basis-full md:min-w-0 md:flex-1 md:basis-auto">
                                            <input
                                                value={technique}
                                                readOnly={
                                                    readOnly ||
                                                    presets.includes(technique)
                                                }
                                                onChange={(event) =>
                                                    updateSet(setIndex, {
                                                        technique:
                                                            event.target.value,
                                                    })
                                                }
                                                maxLength={USER_NAME_MAX}
                                                placeholder={t(
                                                    'exercise.techniquePlaceholder'
                                                )}
                                                aria-label={t(
                                                    'exercise.technique',
                                                    { e, n }
                                                )}
                                                className={`${
                                                    wrong.technique
                                                        ? wrongFieldClass
                                                        : fieldClass
                                                } ${rowFieldClass} w-full ${
                                                    readOnly
                                                        ? ''
                                                        : 'pr-12 md:pr-3'
                                                }`}
                                            />
                                            {!readOnly && (
                                                <button
                                                    type="button"
                                                    onClick={removeTechnique}
                                                    aria-label={t(
                                                        'exercise.removeTechniqueLabel',
                                                        { e, n }
                                                    )}
                                                    className={`${removeButtonClass} absolute top-1/2 right-0.5 -translate-y-1/2 md:hidden`}
                                                >
                                                    <X
                                                        size={14}
                                                        aria-hidden
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {!readOnly && (
                                                <div className="basis-full md:hidden">
                                                    {techniqueDropdown(
                                                        `${addFieldClass} ${rowFieldClass} w-full`
                                                    )}
                                                </div>
                                            )}
                                            <div
                                                aria-hidden
                                                className="hidden md:block md:min-w-0 md:flex-1"
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {!readOnly && (
                <div className="flex items-center justify-between gap-2">
                    <button
                        type="button"
                        disabled={full}
                        onClick={() =>
                            onChange({ sets: [...exercise.sets, emptySet] })
                        }
                        aria-label={t('exercise.addSetLabel', { e })}
                        className={`${rowButtonClass} hover:text-pulse`}
                    >
                        <Plus
                            size={14}
                            aria-hidden
                        />
                        {t('exercise.addSet')}
                    </button>
                    <button
                        type="button"
                        disabled={!canRemove}
                        onClick={onRemove}
                        aria-label={t('exercise.delete', { e })}
                        className={`${rowButtonClass} hover:text-danger`}
                    >
                        <X
                            size={14}
                            aria-hidden
                        />
                        {t('exercise.removeShort')}
                    </button>
                </div>
            )}
        </div>
    );
}
