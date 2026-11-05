'use client';

import { useT } from '@/i18n/use-t';
import { NAME_MAX, SETS } from '@/lib/constants';
import { emptySet, type ExerciseDraft, type SetDraft } from '@/lib/drafts';
import {
    groupAt,
    groupsOf,
    setName,
    setPlaces,
    type SubKind,
} from '@/lib/sets';
import { isTimed, type RepMode } from '@/lib/reps';
import type { ExerciseFault } from '@/lib/validate';
import { cardClass, titleInputClass, wrongTitleInputClass } from '@/lib/ui';
import { ExerciseFoot } from '@/components/workout/exercise-foot';
import { ExerciseNameField } from '@/components/workout/exercise-name-field';
import { RepModeSelect } from '@/components/workout/rep-mode-select';
import { RepsFields } from '@/components/workout/reps-fields';
import { RowHead } from '@/components/workout/row-head';
import { SetMenu } from '@/components/workout/set-menu';
import { SubSetRow } from '@/components/workout/sub-set-row';
import { TechniqueField } from '@/components/workout/technique-field';
import { TechniqueInput } from '@/components/workout/technique-input';
import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';

const noFault = { min: false, max: false, value: false, technique: false };

/**
 * One exercise of the day, in a card of its own. Holds none of the plan: the
 * whole day is a single form, and its draft lives in the editor above so one
 * Save covers all of them — all the card keeps is which set, if any, is having
 * a custom technique written. Every field can be left blank — the routine is validated as a
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
    onMove,
    isLast,
    suggestions = [],
}: {
    exercise: ExerciseDraft;
    index: number;
    /** What the name field offers: exercises the day archived, which come back
        with their history when a card is named after one. */
    suggestions?: readonly string[];
    /** The fields to paint red, or nothing while the eye is off. Comes from the
        day's own errors, so it never flags something only the draft knows. */
    fault?: ExerciseFault;
    onChange: (patch: Partial<ExerciseDraft>) => void;
    onRemove: () => void;
    canRemove: boolean;
    /** One place up (-1) or down (1) the day. */
    onMove: (step: -1 | 1) => void;
    isLast: boolean;
}) {
    const t = useT();
    // Labels carry the exercise number too: a day holds several of these, and
    // "Min reps set 1" on its own would name four different inputs.
    const exerciseNumber = index + 1;
    const places = setPlaces(exercise.sets);
    const groups = groupsOf(places);
    const full = exercise.sets.length >= SETS.max;
    // The name the set Add would make gets: one group per working set, and
    // drops and rest-pauses take no number of their own.
    const nextSet = groups.length + 1;
    // The set whose custom technique is being written, in place of its fields.
    // Kept here rather than in the draft: nothing reaches the day until the
    // name is confirmed.
    const [writing, setWriting] = useState<{
        at: number;
        start: string;
    } | null>(null);
    const card = useRef<HTMLDivElement>(null);

    /** Puts the set's fields back, taking the name if one was confirmed, and
        hands the focus back to the technique beside the set — the input it
        was in is gone. */
    function stopWriting(setIndex: number, patch?: Partial<SetDraft>) {
        flushSync(() => {
            setWriting(null);
            if (patch) updateSet(setIndex, patch);
        });
        card.current
            ?.querySelector<HTMLButtonElement>(
                `[data-set="${setIndex}"] button`
            )
            ?.focus();
    }

    function updateSet(setIndex: number, patch: Partial<SetDraft>) {
        onChange({
            sets: exercise.sets.map((set, i) =>
                i === setIndex ? { ...set, ...patch } : set
            ),
        });
    }

    /** Seconds are not reps: crossing into or out of a timed set starts the
        numbers over rather than reading one as the other. */
    function setMode(setIndex: number, mode: RepMode) {
        const timed = isTimed(mode) || isTimed(exercise.sets[setIndex].mode);
        updateSet(
            setIndex,
            timed ? { mode, repMin: '', repMax: '' } : { mode }
        );
    }

    /**
     * `count` is the whole group: a drop set is defined by the working set in
     * front of it, so dropping that set takes its run with it. Leaving them
     * behind would hang them off whatever ended up above instead — and a run
     * left at the top of the exercise has no working set at all, which is the
     * one shape `readPlan` refuses outright.
     */
    function removeSet(setIndex: number, count: number) {
        // The rows shift up behind it, so what was being written goes too.
        setWriting(null);
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
            ref={card}
            className={`${cardClass} pb-2 md:pb-3 ${wrongAnywhere ? 'border-l-danger' : ''}`}
        >
            <div className="relative mb-4">
                <ExerciseNameField
                    value={exercise.name}
                    onChange={(name) => onChange({ name })}
                    suggestions={suggestions}
                    aria-label={t('exercise.nameLabel', {
                        exercise: exerciseNumber,
                    })}
                    placeholder={t('exercise.namePlaceholder')}
                    maxLength={NAME_MAX}
                    className={`${
                        fault?.name ? wrongTitleInputClass : titleInputClass
                    } display text-2xl [&::-webkit-search-cancel-button]:appearance-none`}
                />
            </div>

            {groups.map((group, position) => {
                const setIndex = group.at;
                const set = exercise.sets[setIndex];
                const setLabel = setName(places[setIndex]);
                const wrong = fault?.sets[setIndex] ?? noFault;
                const run = groupAt(exercise.sets, setIndex);
                const count = run.insertAt - setIndex;

                return (
                    <div
                        key={setIndex}
                        data-set={setIndex}
                        className={position > 0 ? 'mt-6' : ''}
                    >
                        <RowHead
                            label={t('today.set', { n: setLabel })}
                            beside={
                                <TechniqueField
                                    exerciseNumber={exerciseNumber}
                                    setLabel={setLabel}
                                    technique={set.technique}
                                    wrong={wrong.technique}
                                    onChange={(technique) =>
                                        // A preset, or none, picked while a
                                        // name was being written ends that.
                                        writing?.at === setIndex
                                            ? stopWriting(setIndex, {
                                                  technique,
                                              })
                                            : updateSet(setIndex, { technique })
                                    }
                                    onWrite={(start) =>
                                        setWriting({ at: setIndex, start })
                                    }
                                    writing={writing?.at === setIndex}
                                />
                            }
                        >
                            <SetMenu
                                exerciseNumber={exerciseNumber}
                                setLabel={setLabel}
                                kind={run.kind}
                                full={full}
                                canRemove={exercise.sets.length > count}
                                onAdd={(kind) => addSub(setIndex, kind)}
                                onRemove={() => removeSet(setIndex, count)}
                            />
                        </RowHead>
                        <div className="mt-2.5">
                            {writing?.at === setIndex ? (
                                <TechniqueInput
                                    exerciseNumber={exerciseNumber}
                                    setLabel={setLabel}
                                    start={writing.start}
                                    onConfirm={(technique) =>
                                        stopWriting(setIndex, { technique })
                                    }
                                    onCancel={() => stopWriting(setIndex)}
                                />
                            ) : (
                                <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                                    <RepModeSelect
                                        exerciseNumber={exerciseNumber}
                                        setLabel={setLabel}
                                        mode={set.mode}
                                        onChange={(mode) =>
                                            setMode(setIndex, mode)
                                        }
                                    />
                                    <RepsFields
                                        exerciseNumber={exerciseNumber}
                                        setLabel={setLabel}
                                        mode={set.mode}
                                        repMin={set.repMin}
                                        repMax={set.repMax}
                                        wrong={wrong}
                                        onChange={(patch) =>
                                            updateSet(setIndex, patch)
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        {group.subs.map((subIndex) => (
                            <SubSetRow
                                key={subIndex}
                                exerciseNumber={exerciseNumber}
                                // Only drops and rest-pauses hang off a set.
                                kind={places[subIndex].kind as SubKind}
                                name={setName(places[subIndex])}
                                set={exercise.sets[subIndex]}
                                wrong={fault?.sets[subIndex] ?? noFault}
                                onMode={(mode) => setMode(subIndex, mode)}
                                onChange={(patch) => updateSet(subIndex, patch)}
                                onRemove={() => removeSet(subIndex, 1)}
                            />
                        ))}
                    </div>
                );
            })}

            <ExerciseFoot
                exerciseNumber={exerciseNumber}
                nextSet={nextSet}
                full={full}
                onAddSet={() =>
                    onChange({ sets: [...exercise.sets, emptySet] })
                }
                isFirst={index === 0}
                isLast={isLast}
                onMove={onMove}
                canRemove={canRemove}
                onRemove={onRemove}
            />
        </div>
    );
}
