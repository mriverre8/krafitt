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
    SUB_KINDS,
    type SetKind,
    type SetPlace,
    type SubKind,
} from '@/lib/sets';
import type { ExerciseFault } from '@/lib/validate';
import {
    cardClass,
    dashedActionClass,
    fieldClass,
    menuDangerClass,
    menuItemClass,
    removeButtonClass,
    titleInputClass,
    wrongFieldClass,
    wrongTitleInputClass,
} from '@/lib/ui';
import { Ellipsis, Plus, Trash, Type, X } from 'lucide-react';
import type { ReactNode } from 'react';
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
    reps share out their slot, the drop or rest-pause value takes its column. */
const numberClass = (wrong: boolean) =>
    `${wrong ? wrongFieldClass : fieldClass} ${rowFieldClass} min-w-0 ` +
    `px-1 text-center md:px-3`;

const noFault = { min: false, max: false, value: false, technique: false };

/** The reps take one slot whatever the mode puts in it — two boxes for a range,
    one for a fixed count, a dash for AMRAP — so the row keeps its shape when
    the mode changes under it, and the columns line up down the card.

    `min-w-0` is what makes that work. A flex item's automatic minimum is its
    content, and for a box holding `<input>`s that is their intrinsic ~170px
    each — so a range would blow the row open and push the drop's per cent onto
    a line of its own however little the reps were given. */
const repsSlotClass =
    'flex min-w-0 flex-1 gap-1.5 md:w-48 md:flex-none md:gap-2';

/** Joins the two boxes of a range, so the pair reads as one prescription
    instead of two loose numbers. */
const rangeJoinClass = 'text-muted shrink-0 self-center text-sm';

/** A mode that prescribes no number still fills the slot the numbers would
    have, and says what it asks for instead. It used to be a dash, which in a
    line of boxes reads as a field somebody forgot rather than as the whole of
    the answer.

    Not a field: there is nothing to type, so it is no input and takes no focus,
    and its border never picks up the hover a field's does. Its own shell rather
    than `fieldClass` with overrides — that would put two `text-` and two
    `border-` utilities on one element, and which of each pair wins comes down
    to the order Tailwind emits them in, not the order they are written.

    Wraps rather than truncates. The slot is at its narrowest on a drop or
    rest-pause row, where it shares the line with that set's own amount, and
    "Repeticiones sin especificar" does not fit there on one line in any size
    worth reading — but it fits on two, and half a word behind an ellipsis is
    worse than a short second line. `overflow-hidden` is the backstop: whatever
    a translation does to the length, it can never push the row taller.

    `prescribed` is what separates the two modes that land here. AMRAP is an
    answer — the set asks you to go to failure, and that is the whole of what it
    asks — so it is set in the ink and at the size a filled-in field is, and
    reads as done. Unspecified is a hole the routine has not closed yet, so it
    stays muted and a step smaller, like the placeholder it stands in for. */
const readoutClass = (prescribed: boolean) =>
    'flex min-w-0 flex-1 items-center justify-center overflow-hidden ' +
    'rounded-md border-2 border-line bg-surface2 px-2 text-center ' +
    'font-medium leading-tight ' +
    (prescribed
        ? 'text-ink text-sm md:text-base'
        : 'text-muted text-xs md:text-sm');

/** The techniques the menu offers before Custom, in the order it offers them:
    a warm-up opens the exercise, so it opens the list too. */
const TECHNIQUES = ['warmup', 'linear', 'topset', 'backoff'] as const;

/** The column a drop or rest-pause set puts its own amount in. Narrow on a
    phone — it holds two digits and a unit, and every pixel it does not need is
    a pixel the reps beside it do — and back to field width from md up. */
const valueSlotClass = 'w-14 shrink-0 md:w-32';

/** The column the working set gives its technique. It takes the line under the
    reps on a phone and the rest of the line beside them from md up, and it is
    there whether the set has a technique or not — an empty slot you can see is
    what tells you the set can have one at all. */
const techniqueSlotClass =
    'relative mt-1.5 min-w-40 basis-full md:mt-0 md:min-w-0 md:flex-1 md:basis-auto';

/** The × that hands a written technique back to the empty slot. Sits inside the
    field, so the way out is where the thing it removes is. */
const clearTechniqueClass =
    'text-muted hover:text-danger absolute top-1/2 right-0.5 flex min-h-11 ' +
    'min-w-11 -translate-y-1/2 items-center justify-center rounded-md ' +
    'transition-colors md:min-h-9 md:min-w-9';

/** The per cents the drop menu offers. Round, and well inside DROP_PERCENT: a
    drop is sized by feel, and the odd numbers are not worth a keyboard. */
const DROP_VALUES = [10, 20, 30, 40, 50];

const valueLimits = { drop: DROP_PERCENT, rest: REST_SECONDS, normal: REPS };

/** A dead menu row still has to look dead: `menuItemClass` and `menuDangerClass`
    both end in a hover colour, and a hover left live on a disabled row is the
    one thing that makes it look alive. */
const offClass = 'disabled:pointer-events-none disabled:opacity-40';

/** A working set and the drop or rest-pause sets hanging off it, as positions
    in the flat list the exercise actually holds. */
type Group = { at: number; subs: number[] };

function groupsOf(places: SetPlace[]): Group[] {
    const groups: Group[] = [];
    places.forEach((place, index) => {
        const last = groups[groups.length - 1];
        // A run with no working set in front of it is a shape `readPlan`
        // refuses, so it can never be saved — but it can still be rendered, and
        // a row that silently vanishes is worse than one standing on its own.
        if (place.kind === 'normal' || !last)
            groups.push({ at: index, subs: [] });
        else last.subs.push(index);
    });
    return groups;
}

/**
 * One exercise of the day, in a card of its own. Holds no state: the whole day
 * is a single form, and its draft lives in the editor above so one Save covers
 * all of them. Every field can be left blank — the routine is validated as a
 * whole before it can be activated.
 *
 * Two layers and only two: the fields, and one menu per row for everything you
 * can do *to* that row. The editor used to spell each action out beside each
 * set, which put three text buttons at the head of every line and left a day of
 * nine sets carrying some forty controls, the plan itself the quietest thing on
 * the page. Now a row shows what it asks of you and nothing else; the ⋯ holds
 * the rest, and says so only when asked.
 *
 * A drop or rest-pause set is a row of the same flat list, sitting behind the
 * working set it hangs off rather than nested inside it (see `lib/sets.ts`). On
 * screen it is indented under that set, against a rule, so the group reads as
 * one block. One working set takes one kind or the other, never both: once it
 * has one, its menu offers only more of that kind.
 */
export function ExerciseFields({
    exercise,
    index,
    fault,
    onChange,
    onRemove,
    canRemove,
}: {
    exercise: ExerciseDraft;
    index: number;
    /** The fields to paint red, or nothing while the eye is off. Comes from the
        day's own errors, so it never flags something only the draft knows. */
    fault?: ExerciseFault;
    onChange: (patch: Partial<ExerciseDraft>) => void;
    onRemove: () => void;
    canRemove: boolean;
}) {
    const t = useT();
    // Labels carry the exercise number too: a day holds several of these, and
    // "Min reps set 1" on its own would name four different inputs.
    const e = index + 1;
    const places = setPlaces(exercise.sets);
    const groups = groupsOf(places);
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

    function modeSelect(setIndex: number, set: SetDraft, n: string) {
        return (
            <select
                value={set.mode}
                onChange={(event) =>
                    updateSet(setIndex, { mode: event.target.value as RepMode })
                }
                aria-label={t('exercise.repMode', { e, n })}
                className={`${fieldClass} ${rowFieldClass} w-24 shrink-0 px-2 md:w-28 md:px-3`}
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
        );
    }

    function repsFields(setIndex: number, set: SetDraft, n: string) {
        const wrong = fault?.sets[setIndex] ?? noFault;
        if (hasNoReps(set.mode)) {
            const amrap = set.mode === 'amrap';
            return (
                <span
                    aria-hidden
                    className={`${readoutClass(amrap)} ${rowFieldClass}`}
                >
                    {t(amrap ? 'reps.toFailure' : 'reps.noneSpecified')}
                </span>
            );
        }
        return (
            <>
                <input
                    type="number"
                    inputMode="numeric"
                    min={REPS.min}
                    max={REPS.max}
                    value={set.repMin}
                    onChange={(event) =>
                        updateSet(setIndex, {
                            repMin: event.target.value.slice(0, REPS.digits),
                        })
                    }
                    placeholder={t('today.reps')}
                    aria-label={t('exercise.repMin', { e, n })}
                    className={`${numberClass(wrong.min)} flex-1`}
                />
                {set.mode === 'range' && (
                    <>
                        <span
                            aria-hidden
                            className={rangeJoinClass}
                        >
                            {t('reps.to')}
                        </span>
                        <input
                            type="number"
                            inputMode="numeric"
                            min={REPS.min}
                            max={REPS.max}
                            value={set.repMax}
                            onChange={(event) =>
                                updateSet(setIndex, {
                                    repMax: event.target.value.slice(
                                        0,
                                        REPS.digits
                                    ),
                                })
                            }
                            placeholder={t('today.reps')}
                            aria-label={t('exercise.repMax', { e, n })}
                            className={`${numberClass(wrong.max)} flex-1`}
                        />
                    </>
                )}
            </>
        );
    }

    /**
     * What to do with the working set itself, behind the one ⋯ at the head of
     * its row: hang a drop or rest-pause off it, or take it out. The technique
     * used to sit in here too and no longer does — it is a field on the row
     * now, and a field that opens its own menu.
     */
    function setMenu(setIndex: number, n: string) {
        const group = groupAt(exercise.sets, setIndex);
        const count = group.insertAt - setIndex;
        const canRemoveSet = exercise.sets.length > count;

        return (
            <Dropdown
                label={t('exercise.setMenu', { e, n })}
                icon={
                    <Ellipsis
                        size={18}
                        aria-hidden
                    />
                }
            >
                {(close) => (
                    <>
                        {(group.kind ? [group.kind] : SUB_KINDS).map((kind) => (
                            <button
                                key={kind}
                                type="button"
                                disabled={full}
                                onClick={() => {
                                    addSub(setIndex, kind);
                                    close();
                                }}
                                className={`${menuItemClass} ${offClass}`}
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
                        ))}
                        <button
                            type="button"
                            disabled={!canRemoveSet}
                            onClick={() => {
                                removeSet(setIndex, count);
                                close();
                            }}
                            aria-label={t('exercise.removeSet', { e, n })}
                            className={`${menuDangerClass} ${offClass}`}
                        >
                            <X
                                size={14}
                                aria-hidden
                            />
                            {t('exercise.removeSetShort')}
                        </button>
                    </>
                )}
            </Dropdown>
        );
    }

    /**
     * The working set's technique, in the one slot it always occupies. Three
     * states, and the row keeps its shape through all of them:
     *
     * - nothing yet — a dashed field that says so, the way the drop's per cent
     *   does, and pressing it opens the list;
     * - one off the list — the field says which, and pressing it opens the same
     *   list again, so swapping is picking afresh rather than clearing first;
     * - written by hand — a field to type in, with an × inside that hands the
     *   set back to the first state.
     *
     * Which of the last two you are in is read off the value itself: anything
     * the list could have written is shown, anything else is typed. That is why
     * Custom sets it blank rather than to some marker — blank is a name the
     * list does not offer, and the routine already calls a blank one a hole.
     */
    function techniqueField(setIndex: number, set: SetDraft, n: string) {
        const technique = set.technique;
        const wrong = (fault?.sets[setIndex] ?? noFault).technique;
        const written = technique !== null && !presets.includes(technique);

        if (written)
            return (
                <div className={techniqueSlotClass}>
                    <input
                        value={technique}
                        onChange={(event) =>
                            updateSet(setIndex, {
                                technique: event.target.value,
                            })
                        }
                        maxLength={USER_NAME_MAX}
                        placeholder={t('exercise.techniquePlaceholder')}
                        aria-label={t('exercise.technique', { e, n })}
                        className={`${
                            wrong ? wrongFieldClass : fieldClass
                        } ${rowFieldClass} w-full pr-12`}
                    />
                    <button
                        type="button"
                        onClick={() => updateSet(setIndex, { technique: null })}
                        aria-label={t('exercise.removeTechniqueLabel', {
                            e,
                            n,
                        })}
                        className={clearTechniqueClass}
                    >
                        <X
                            size={14}
                            aria-hidden
                        />
                    </button>
                </div>
            );

        return (
            <div className={techniqueSlotClass}>
                <Dropdown
                    label={t('exercise.techniqueMenu', { e, n })}
                    align="right"
                    className={
                        technique === null
                            ? `${dashedActionClass} ${rowFieldClass} w-full px-3`
                            : `${wrong ? wrongFieldClass : fieldClass} ${rowFieldClass} flex w-full items-center`
                    }
                    icon={
                        technique === null ? (
                            <>
                                <Plus
                                    size={14}
                                    aria-hidden
                                />
                                {t('exercise.noTechnique')}
                            </>
                        ) : (
                            technique
                        )
                    }
                >
                    {(close) => (
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
                                        updateSet(setIndex, {
                                            technique: null,
                                        });
                                        close();
                                    }}
                                    aria-label={t(
                                        'exercise.removeTechniqueLabel',
                                        { e, n }
                                    )}
                                    className={menuItemClass}
                                >
                                    {t('exercise.unspecified')}
                                </button>
                            )}
                        </>
                    )}
                </Dropdown>
            </div>
        );
    }

    /** A drop or rest-pause row has one thing it can be told: go away. One
        option is not a menu, so the row wears that option itself — same column
        and same target as the working set's ⋯, one tap instead of two. */
    function removeSubButton(setIndex: number, n: string) {
        return (
            <button
                type="button"
                onClick={() => removeSet(setIndex, 1)}
                aria-label={t('exercise.removeSet', { e, n })}
                title={t('exercise.removeSetShort')}
                className={removeButtonClass}
            >
                <X
                    size={16}
                    aria-hidden
                />
            </button>
        );
    }

    /** The head of a row: what the row is, and the one mark that opens
        everything it can be told to do. One short line, so the fields under it
        are what the eye lands on. */
    function rowHead(label: string, sub: boolean, menu: ReactNode) {
        return (
            <div className="flex min-h-10 items-center gap-2">
                <p className={`eyebrow ${sub ? 'text-muted' : 'text-pulse'}`}>
                    {label}
                </p>
                <span className="ml-auto">{menu}</span>
            </div>
        );
    }

    return (
        <div
            className={`${cardClass} ${wrongAnywhere ? 'border-l-danger' : ''}`}
        >
            <div className="relative mb-4">
                <input
                    value={exercise.name}
                    onChange={(event) => onChange({ name: event.target.value })}
                    aria-label={t('exercise.nameLabel', { e })}
                    placeholder={t('exercise.namePlaceholder')}
                    maxLength={NAME_MAX}
                    className={`${
                        fault?.name ? wrongTitleInputClass : titleInputClass
                    } display pr-12 text-2xl md:pr-10`}
                />
                <button
                    type="button"
                    disabled={!canRemove}
                    onClick={onRemove}
                    aria-label={t('exercise.delete', { e })}
                    title={t('exercise.removeShort')}
                    className={`${removeButtonClass} absolute top-1/2 right-0 -translate-y-1/2`}
                >
                    <Trash
                        size={16}
                        aria-hidden
                    />
                </button>
            </div>

            {groups.map((group, position) => {
                const setIndex = group.at;
                const set = exercise.sets[setIndex];
                const n = setName(places[setIndex]);

                return (
                    <div
                        key={setIndex}
                        className={
                            position > 0 ? 'border-line mt-5 border-t pt-2' : ''
                        }
                    >
                        {rowHead(
                            t('today.set', { n }),
                            false,
                            setMenu(setIndex, n)
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                            {modeSelect(setIndex, set, n)}
                            <div className={repsSlotClass}>
                                {repsFields(setIndex, set, n)}
                            </div>
                            {techniqueField(setIndex, set, n)}
                        </div>

                        {group.subs.map((subIndex) => {
                            const sub = exercise.sets[subIndex];
                            const place = places[subIndex];
                            const subWrong = fault?.sets[subIndex] ?? noFault;
                            const subName = setName(place);
                            const limit = valueLimits[place.kind];

                            return (
                                <div
                                    key={subIndex}
                                    className="mt-1"
                                >
                                    {rowHead(
                                        t(
                                            place.kind === 'drop'
                                                ? 'set.drop'
                                                : 'set.rest'
                                        ),
                                        true,
                                        removeSubButton(subIndex, subName)
                                    )}
                                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                                        {modeSelect(subIndex, sub, subName)}
                                        <div className={repsSlotClass}>
                                            {repsFields(subIndex, sub, subName)}
                                        </div>
                                        {place.kind === 'drop' ? (
                                            <Dropdown
                                                label={t('exercise.setValue', {
                                                    e,
                                                    label: subName,
                                                })}
                                                className={
                                                    sub.value
                                                        ? `${numberClass(false)} ${valueSlotClass}`
                                                        : `${dashedActionClass} ${rowFieldClass} ${valueSlotClass} px-1`
                                                }
                                                icon={
                                                    sub.value ? (
                                                        `${sub.value}${t('set.dropUnit')}`
                                                    ) : (
                                                        <>
                                                            <Plus
                                                                size={14}
                                                                aria-hidden
                                                            />
                                                            {t('set.dropUnit')}
                                                        </>
                                                    )
                                                }
                                            >
                                                {(close) => (
                                                    <>
                                                        {DROP_VALUES.map(
                                                            (percent) => (
                                                                <button
                                                                    key={
                                                                        percent
                                                                    }
                                                                    type="button"
                                                                    onClick={() => {
                                                                        updateSet(
                                                                            subIndex,
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
                                                        {sub.value !== '' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    updateSet(
                                                                        subIndex,
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
                                                                    'exercise.unspecified'
                                                                )}
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </Dropdown>
                                        ) : (
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                min={limit.min}
                                                max={limit.max}
                                                value={sub.value}
                                                onChange={(event) =>
                                                    updateSet(subIndex, {
                                                        value: event.target.value.slice(
                                                            0,
                                                            limit.digits
                                                        ),
                                                    })
                                                }
                                                placeholder={t('set.restUnit')}
                                                aria-label={t(
                                                    'exercise.setValue',
                                                    { e, label: subName }
                                                )}
                                                className={`${numberClass(
                                                    subWrong.value
                                                )} ${valueSlotClass}`}
                                            />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                );
            })}

            <button
                type="button"
                disabled={full}
                onClick={() => onChange({ sets: [...exercise.sets, emptySet] })}
                aria-label={t('exercise.addSetLabel', { e })}
                className={`${dashedActionClass} mt-8 w-full py-3.5`}
            >
                <Plus
                    size={14}
                    aria-hidden
                />
                {t('exercise.addSet')}
            </button>
        </div>
    );
}
