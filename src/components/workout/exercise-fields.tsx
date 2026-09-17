'use client';

import { useT } from '@/i18n/use-t';
import {
    DROP_PERCENT,
    NAME_MAX,
    REPS,
    REST_SECONDS,
    SETS,
} from '@/lib/constants';
import { emptySet, type ExerciseDraft, type SetDraft } from '@/lib/drafts';
import {
    groupAt,
    groupsOf,
    setName,
    setPlaces,
    type SubKind,
} from '@/lib/sets';
import type { ExerciseFault } from '@/lib/validate';
import {
    cardClass,
    dashedActionClass,
    numberClass,
    removeButtonClass,
    titleInputClass,
    valueSlotClass,
    wrongTitleInputClass,
} from '@/lib/ui';
import { Plus, Trash } from 'lucide-react';
import { DropPercentMenu } from '@/components/workout/drop-percent-menu';
import { RepModeSelect } from '@/components/workout/rep-mode-select';
import { RepsFields } from '@/components/workout/reps-fields';
import { RemoveSubButton } from '@/components/workout/remove-sub-button';
import { RowHead } from '@/components/workout/row-head';
import { SetMenu } from '@/components/workout/set-menu';
import { TechniqueField } from '@/components/workout/technique-field';

const noFault = { min: false, max: false, value: false, technique: false };

const valueLimits = { drop: DROP_PERCENT, rest: REST_SECONDS, normal: REPS };

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
                const wrong = fault?.sets[setIndex] ?? noFault;
                const run = groupAt(exercise.sets, setIndex);
                const count = run.insertAt - setIndex;

                return (
                    <div
                        key={setIndex}
                        className={
                            position > 0 ? 'border-line mt-5 border-t pt-2' : ''
                        }
                    >
                        <RowHead label={t('today.set', { n })}>
                            <SetMenu
                                e={e}
                                n={n}
                                kind={run.kind}
                                full={full}
                                canRemove={exercise.sets.length > count}
                                onAdd={(kind) => addSub(setIndex, kind)}
                                onRemove={() => removeSet(setIndex, count)}
                            />
                        </RowHead>
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                            <RepModeSelect
                                e={e}
                                n={n}
                                mode={set.mode}
                                onChange={(mode) =>
                                    updateSet(setIndex, { mode })
                                }
                            />
                            <RepsFields
                                e={e}
                                n={n}
                                mode={set.mode}
                                repMin={set.repMin}
                                repMax={set.repMax}
                                wrong={wrong}
                                onChange={(patch) => updateSet(setIndex, patch)}
                            />
                            <TechniqueField
                                e={e}
                                n={n}
                                technique={set.technique}
                                wrong={wrong.technique}
                                onChange={(technique) =>
                                    updateSet(setIndex, { technique })
                                }
                            />
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
                                    <RowHead
                                        label={t(
                                            place.kind === 'drop'
                                                ? 'set.drop'
                                                : 'set.rest'
                                        )}
                                        sub
                                    >
                                        <RemoveSubButton
                                            e={e}
                                            n={subName}
                                            onRemove={() =>
                                                removeSet(subIndex, 1)
                                            }
                                        />
                                    </RowHead>
                                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                                        <RepModeSelect
                                            e={e}
                                            n={subName}
                                            mode={sub.mode}
                                            onChange={(mode) =>
                                                updateSet(subIndex, { mode })
                                            }
                                        />
                                        <RepsFields
                                            e={e}
                                            n={subName}
                                            mode={sub.mode}
                                            repMin={sub.repMin}
                                            repMax={sub.repMax}
                                            wrong={subWrong}
                                            onChange={(patch) =>
                                                updateSet(subIndex, patch)
                                            }
                                        />
                                        {place.kind === 'drop' ? (
                                            <DropPercentMenu
                                                e={e}
                                                n={subName}
                                                value={sub.value}
                                                onChange={(value) =>
                                                    updateSet(subIndex, {
                                                        value,
                                                    })
                                                }
                                            />
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
