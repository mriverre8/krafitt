'use client';

import { useT } from '@/i18n/use-t';
import { REPS } from '@/lib/constants';
import { hasNoReps, type RepMode } from '@/lib/reps';
import { numberClass, rowFieldClass } from '@/lib/ui';

const repsSlotClass =
    'flex min-w-0 flex-1 gap-1.5 md:w-48 md:flex-none md:gap-2';

/** Digits only, so a minus sign, a decimal point or an `e` never reaches the
    draft — the server would turn the day away over them, with nothing to say
    which box was at fault. A text box rather than a number one: a number box
    reports a lone "-" as empty and leaves it on screen. */
const digits = (value: string) =>
    value.replace(/\D/g, '').slice(0, REPS.digits);

/**
 * What the set asks for in reps, in the one slot the row always gives it. The
 * slot is the component's own, not the caller's: the range fills it with two
 * boxes and a joining word, and a mode that prescribes nothing fills it with a
 * readout saying so, and either way the row is one column wider than the mode.
 * A timed set takes one box, like a fixed count, but in seconds.
 */
export function RepsFields({
    exerciseNumber,
    setLabel,
    mode,
    repMin,
    repMax,
    wrong,
    onChange,
}: {
    /** The exercise's number in the day, and the set's name inside it: both
        boxes are labelled from them, and no two may share a name. */
    exerciseNumber: number;
    setLabel: string;
    mode: RepMode;
    repMin: string;
    repMax: string;
    /** Which of the two boxes to paint red. Comes from the day's own errors, so
        it never flags something only the draft knows. */
    wrong: { min: boolean; max: boolean };
    onChange: (patch: { repMin?: string; repMax?: string }) => void;
}) {
    const t = useT();
    const timed = mode === 'time';

    if (hasNoReps(mode)) {
        const amrap = mode === 'amrap';
        return (
            <div className={repsSlotClass}>
                <span
                    aria-hidden
                    className={`border-line bg-surface2 flex min-w-0 flex-1 items-center justify-center overflow-hidden rounded-md border-2 px-2 text-center leading-tight font-medium ${rowFieldClass} ${
                        amrap
                            ? 'text-ink text-sm md:text-base'
                            : 'text-muted text-xs md:text-sm'
                    }`}
                >
                    {t(
                        amrap
                            ? 'reps.toFailure'
                            : mode === 'unspecifiedTime'
                              ? 'reps.noTime'
                              : 'reps.noneSpecified'
                    )}
                </span>
            </div>
        );
    }

    return (
        <div className={repsSlotClass}>
            <input
                type="text"
                inputMode="numeric"
                value={repMin}
                onChange={(event) =>
                    onChange({ repMin: digits(event.target.value) })
                }
                placeholder={t(timed ? 'today.seconds' : 'today.reps')}
                aria-label={t(timed ? 'exercise.seconds' : 'exercise.repMin', {
                    exercise: exerciseNumber,
                    set: setLabel,
                })}
                className={`${numberClass(wrong.min)} flex-1`}
            />
            {mode === 'range' && (
                <>
                    <span
                        aria-hidden
                        className={'text-muted shrink-0 self-center text-sm'}
                    >
                        {t('reps.to')}
                    </span>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={repMax}
                        onChange={(event) =>
                            onChange({ repMax: digits(event.target.value) })
                        }
                        placeholder={t('today.reps')}
                        aria-label={t('exercise.repMax', {
                            exercise: exerciseNumber,
                            set: setLabel,
                        })}
                        className={`${numberClass(wrong.max)} flex-1`}
                    />
                </>
            )}
        </div>
    );
}
