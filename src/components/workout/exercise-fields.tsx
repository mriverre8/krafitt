'use client';

import { useT } from '@/i18n/use-t';
import {
    NAME_MAX,
    REPS,
    SETS,
    USER_NAME_MAX,
    VALUE_LIMITS,
} from '@/lib/constants';
import { emptySet, noFault } from '@/lib/drafts';
import { REP_MODES, type RepMode } from '@/lib/reps';
import {
    groupAt,
    setName,
    setPlaces,
    setShortLabel,
    SUB_KINDS,
    type SubKind,
} from '@/lib/sets';
import type { ExerciseDraft, SetDraft } from '@/lib/types';
import type { ExerciseFault } from '@/lib/validate';
import {
    cardClass,
    fieldClass,
    menuItemClass,
    numberClass,
    rangeJoinClass,
    removeButtonClass,
    repsSlotClass,
    rowButtonClass,
    rowFieldClass,
    titleInputClass,
    wrongTitleInputClass,
} from '@/lib/ui';
import { Plus, X } from 'lucide-react';
import { useId } from 'react';
import { Dropdown } from '@/components/ui/dropdown';

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
    const techniqueListId = useId();
    // Labels carry the exercise number too: a day holds several of these, and
    // "Min reps set 1" on its own would name four different inputs.
    const e = index + 1;
    const places = setPlaces(exercise.sets);
    const full = exercise.sets.length >= SETS.max;

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
            fault.sets.some((set) => set.min || set.max || set.value));

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
                    const limit = VALUE_LIMITS[place.kind];

                    const group = sub ? null : groupAt(exercise.sets, setIndex);
                    const count = group ? group.insertAt - setIndex : 1;
                    const canRemoveSet = exercise.sets.length > count;

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
                            className={`space-y-1.5 transition-colors md:border-l-4 md:pl-3 ${
                                sub
                                    ? 'mt-2 md:mt-0 md:pt-2'
                                    : setIndex > 0
                                      ? 'mt-7'
                                      : ''
                            } ${
                                wrong.min || wrong.max || wrong.value
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
                                    {!readOnly && (
                                        <button
                                            type="button"
                                            disabled={!canRemoveSet}
                                            onClick={() =>
                                                removeSet(setIndex, count)
                                            }
                                            aria-label={t(
                                                'exercise.removeSet',
                                                { e, n }
                                            )}
                                            className={`${rowButtonClass} hover:text-danger`}
                                        >
                                            <X
                                                size={14}
                                                aria-hidden
                                            />
                                            {t('exercise.removeSetShort')}
                                        </button>
                                    )}
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
                                            mode: event.target.value as RepMode,
                                        })
                                    }
                                    aria-label={t('exercise.repMode', {
                                        e,
                                        n,
                                    })}
                                    className={`${fieldClass} ${rowFieldClass} w-24 shrink-0 px-2 md:w-28 md:px-3 ${
                                        readOnly ? 'pointer-events-none' : ''
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
                                    {set.mode === 'amrap' ? (
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
                                                placeholder={t('today.reps')}
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
                                {!readOnly && (
                                    <div className="hidden md:order-last md:block">
                                        {removeButton}
                                    </div>
                                )}
                                {sub ? (
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        min={limit.min}
                                        max={limit.max}
                                        value={set.value}
                                        readOnly={readOnly}
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
                                        )} w-16 shrink-0 md:w-20`}
                                    />
                                ) : (
                                    <input
                                        list={
                                            readOnly
                                                ? undefined
                                                : techniqueListId
                                        }
                                        value={set.technique}
                                        readOnly={readOnly}
                                        onChange={(event) =>
                                            updateSet(setIndex, {
                                                technique: event.target.value,
                                            })
                                        }
                                        maxLength={USER_NAME_MAX}
                                        placeholder={t(
                                            'exercise.techniquePlaceholder'
                                        )}
                                        aria-label={t('exercise.technique', {
                                            e,
                                            n,
                                        })}
                                        className={`${fieldClass} ${rowFieldClass} min-w-40 basis-full md:min-w-0 md:flex-1 md:basis-auto`}
                                    />
                                )}
                            </div>
                            {addButton && (
                                <div className="hidden pl-10 md:block">
                                    {addButton}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <datalist id={techniqueListId}>
                <option value={t('technique.linear')} />
                <option value={t('technique.warmup')} />
                <option value={t('technique.topset')} />
                <option value={t('technique.backoff')} />
            </datalist>

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
