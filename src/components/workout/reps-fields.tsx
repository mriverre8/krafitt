'use client';

import { useT } from '@/i18n/use-t';
import { REPS } from '@/lib/constants';
import { hasNoReps, type RepMode } from '@/lib/reps';
import { numberClass, rowFieldClass } from '@/lib/ui';

/** The reps take one slot whatever the mode puts in it — two boxes for a range,
    one for a fixed count, a readout for AMRAP — so the row keeps its shape when
    the mode changes under it, and the columns line up down the card.

    `min-w-0` is what makes that work. A flex item's automatic minimum is its
    content, and for a box holding `<input>`s that is their intrinsic ~170px
    each — so a range would blow the row open and push the drop's per cent onto
    a line of its own however little the reps were given. */
const repsSlotClass =
    'flex min-w-0 flex-1 gap-1.5 md:w-48 md:flex-none md:gap-2';


/**
 * What the set asks for in reps, in the one slot the row always gives it. The
 * slot is the component's own, not the caller's: the range fills it with two
 * boxes and a joining word, and a mode that prescribes nothing fills it with a
 * readout saying so, and either way the row is one column wider than the mode.
 */
export function RepsFields({
    e,
    n,
    mode,
    repMin,
    repMax,
    wrong,
    onChange,
}: {
    /** The exercise's number in the day, and the set's name inside it: both
        boxes are labelled from them, and no two may share a name. */
    e: number;
    n: string;
    mode: RepMode;
    repMin: string;
    repMax: string;
    /** Which of the two boxes to paint red. Comes from the day's own errors, so
        it never flags something only the draft knows. */
    wrong: { min: boolean; max: boolean };
    onChange: (patch: { repMin?: string; repMax?: string }) => void;
}) {
    const t = useT();

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
                    {t(amrap ? 'reps.toFailure' : 'reps.noneSpecified')}
                </span>
            </div>
        );
    }

    return (
        <div className={repsSlotClass}>
            <input
                type="number"
                inputMode="numeric"
                min={REPS.min}
                max={REPS.max}
                value={repMin}
                onChange={(event) =>
                    onChange({
                        repMin: event.target.value.slice(0, REPS.digits),
                    })
                }
                placeholder={t('today.reps')}
                aria-label={t('exercise.repMin', { e, n })}
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
                        type="number"
                        inputMode="numeric"
                        min={REPS.min}
                        max={REPS.max}
                        value={repMax}
                        onChange={(event) =>
                            onChange({
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
        </div>
    );
}
