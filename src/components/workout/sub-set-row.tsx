'use client';

import { useT } from '@/i18n/use-t';
import { REST_SECONDS } from '@/lib/constants';
import type { SetDraft } from '@/lib/drafts';
import type { RepMode } from '@/lib/reps';
import type { SubKind } from '@/lib/sets';
import { numberClass, valueSlotClass } from '@/lib/ui';
import { DropPercentMenu } from '@/components/workout/drop-percent-menu';
import { MinutesHint } from '@/components/workout/minutes-hint';
import { RemoveSubButton } from '@/components/workout/remove-sub-button';
import { RepModeSelect } from '@/components/workout/rep-mode-select';
import { RepsFields } from '@/components/workout/reps-fields';
import { RowHead } from '@/components/workout/row-head';

/**
 * A drop or rest-pause row, indented under the working set it hangs off. Its
 * reps as any set's, plus what makes it what it is: the per cent a drop takes
 * off, or the seconds a rest-pause waits.
 */
export function SubSetRow({
    exerciseNumber,
    kind,
    name,
    set,
    wrong,
    onMode,
    onChange,
    onRemove,
}: {
    exerciseNumber: number;
    kind: SubKind;
    /** The row's name inside the exercise (`DS1`). */
    name: string;
    set: SetDraft;
    wrong: { min: boolean; max: boolean; value: boolean };
    onMode: (mode: RepMode) => void;
    onChange: (patch: Partial<SetDraft>) => void;
    onRemove: () => void;
}) {
    const t = useT();
    return (
        <div className="mt-4">
            <RowHead
                label={t(kind === 'drop' ? 'set.drop' : 'set.rest')}
                sub
            >
                <RemoveSubButton
                    exerciseNumber={exerciseNumber}
                    setLabel={name}
                    onRemove={onRemove}
                />
            </RowHead>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 md:gap-2">
                <RepModeSelect
                    exerciseNumber={exerciseNumber}
                    setLabel={name}
                    mode={set.mode}
                    onChange={onMode}
                />
                <RepsFields
                    exerciseNumber={exerciseNumber}
                    setLabel={name}
                    mode={set.mode}
                    repMin={set.repMin}
                    repMax={set.repMax}
                    wrong={wrong}
                    onChange={onChange}
                />
                {kind === 'drop' ? (
                    <DropPercentMenu
                        exerciseNumber={exerciseNumber}
                        setLabel={name}
                        value={set.value}
                        onChange={(value) => onChange({ value })}
                    />
                ) : (
                    <div className={`note-box relative ${valueSlotClass}`}>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={set.value}
                            onChange={(event) =>
                                onChange({
                                    // Digits only, as in `RepsFields`.
                                    value: event.target.value
                                        .replace(/\D/g, '')
                                        .slice(0, REST_SECONDS.digits),
                                })
                            }
                            placeholder={t('set.restUnit')}
                            aria-label={t('exercise.setValue', {
                                exercise: exerciseNumber,
                                label: name,
                            })}
                            className={`${numberClass(wrong.value)} w-full`}
                        />
                        <MinutesHint seconds={set.value} />
                    </div>
                )}
            </div>
        </div>
    );
}
