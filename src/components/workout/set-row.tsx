'use client';

import { useT } from '@/i18n/use-t';
import {
    DEFAULT_EFFORT,
    type Effort,
    type PreviousValue,
    type SetValue,
} from '@/lib/progress';
import { REPS, WEIGHT } from '@/lib/constants';
import { inputClass } from '@/lib/ui';
import { EffortMark } from '@/components/workout/effort-mark';
import { EffortSelector } from '@/components/workout/effort-selector';
import { ArrowRight, Check, Layers, LayersPlus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export function SetRow({
    setIndex,
    label,
    name,
    sub,
    enabled,
    saved,
    previous,
    onSave,
}: {
    setIndex: number;
    /** What this set is called on screen — `3`, or `DS` for a drop set. The
        index still says where it is in the exercise, which is what gets logged. */
    label?: string;
    /** The same, but unique inside the exercise (`DS1`, `DS2`): what the field
        labels are worded from, since two of them must never share a name. */
    name?: string;
    /** A drop or rest-pause set: it hangs off the row above it. */
    sub?: boolean;
    enabled: boolean;
    saved?: SetValue;
    previous?: PreviousValue;
    onSave: (weight: number, reps: number, effort: Effort) => void;
}) {
    const t = useT();
    const shown = label ?? String(setIndex + 1);
    const number = name ?? shown;

    const [draft, setDraft] = useState<{ weight: string; reps: string } | null>(
        null
    );
    const weight = draft?.weight ?? (saved ? String(saved.weight) : '');
    const reps = draft?.reps ?? (saved ? String(saved.reps) : '');

    // The set is banked in two presses. The first one asks how it went, in the
    // place the reps were typed — the row never grows a column for a question
    // that is only worth asking once the set is over. The second one banks it.
    const [asking, setAsking] = useState(false);
    const [picked, setPicked] = useState<Effort | null>(null);

    const parsedWeight = Number(weight);
    const parsedReps = Number.parseInt(reps, 10);
    const ready =
        enabled &&
        weight.trim() !== '' &&
        reps.trim() !== '' &&
        Number.isFinite(parsedWeight) &&
        parsedWeight >= 0 &&
        parsedReps > 0;
    const edited =
        !saved || saved.weight !== parsedWeight || saved.reps !== parsedReps;
    // A mark only ever describes the numbers it was banked with. Edit those
    // and the old answer is about a set that no longer exists, so the question
    // opens where it opens for a set that was never banked at all.
    const effort =
        picked ?? (edited ? DEFAULT_EFFORT : (saved?.effort ?? DEFAULT_EFFORT));
    const changed = edited || (saved?.effort ?? DEFAULT_EFFORT) !== effort;
    // Banked and untouched since. The question being up does not undo that: a
    // set reopened only to look at its mark is still the set that was banked.
    const done = !!saved && !changed;

    const drop = useCallback(() => {
        setAsking(false);
        setPicked(null);
    }, []);

    const row = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!asking) return;
        const outside = (event: MouseEvent) => {
            if (!row.current?.contains(event.target as Node)) drop();
        };
        document.addEventListener('mousedown', outside);
        return () => document.removeEventListener('mousedown', outside);
    }, [asking, drop]);

    const Icon = done ? Check : asking ? ArrowRight : LayersPlus;

    function press() {
        if (!asking) return setAsking(true);
        onSave(parsedWeight, parsedReps, effort);
        drop();
    }

    return (
        <div
            ref={row}
            onKeyDown={(event) => {
                if (event.key === 'Escape' && asking) drop();
            }}
            className={`flex items-center gap-3 border-l-4 pl-3 transition-colors ${
                done ? 'border-surge' : enabled ? 'border-volt' : 'border-line'
            }`}
        >
            <span
                className={`figure w-6.5 shrink-0 md:w-9 ${sub ? 'text-sm' : 'text-xl'} ${
                    done ? 'text-surge' : enabled ? 'text-ink' : 'text-muted'
                }`}
            >
                <span className="sr-only">{t('today.set', { n: number })}</span>
                <span aria-hidden>{shown}</span>
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-2">
                {asking ? (
                    <EffortSelector
                        name={number}
                        value={effort}
                        onChange={setPicked}
                    />
                ) : (
                    <>
                        <input
                            type="number"
                            inputMode="decimal"
                            step={WEIGHT.step}
                            min={WEIGHT.min}
                            max={WEIGHT.max}
                            placeholder={`${previous?.weight ?? ''} ${t(
                                'today.kg'
                            )}`.trim()}
                            aria-label={t('today.weightLabel', { n: number })}
                            disabled={!enabled}
                            value={weight}
                            onChange={(event) =>
                                setDraft({ weight: event.target.value, reps })
                            }
                            className={`${inputClass} figure h-12 text-center text-lg`}
                        />
                        <div className="relative w-full min-w-0">
                            <input
                                type="number"
                                inputMode="numeric"
                                min={REPS.min}
                                max={REPS.max}
                                placeholder={`${previous?.reps ?? ''} ${t(
                                    'today.reps'
                                )}`.trim()}
                                aria-label={t('today.repsLabel', { n: number })}
                                disabled={!enabled}
                                value={reps}
                                onChange={(event) =>
                                    setDraft({
                                        weight,
                                        reps: event.target.value.slice(
                                            0,
                                            REPS.digits
                                        ),
                                    })
                                }
                                className={`${inputClass} figure h-12 text-center text-lg`}
                            />
                            {done && saved?.effort ? (
                                <EffortMark effort={saved.effort} />
                            ) : !reps && previous?.effort ? (
                                <EffortMark
                                    effort={previous.effort}
                                    faint
                                />
                            ) : null}
                        </div>
                    </>
                )}
            </div>
            <button
                type="button"
                disabled={!ready || (asking && !changed)}
                onClick={press}
                aria-label={t(
                    asking ? 'today.confirmLabel' : 'today.saveLabel',
                    { n: number }
                )}
                data-done={done}
                className={`lift relative grid h-12 w-12 shrink-0 place-items-center rounded-md disabled:pointer-events-none ${
                    enabled ? '' : 'opacity-30'
                } ${
                    done
                        ? 'bg-surge text-on-surge'
                        : 'charged bg-volt text-on-volt hover:bg-volt2 disabled:bg-surface2 disabled:text-muted'
                }`}
            >
                <Icon
                    size={20}
                    aria-hidden
                />
                {done && !asking && (
                    <Layers
                        size={11}
                        aria-hidden
                        className="absolute right-0.5 bottom-0.5 opacity-70"
                    />
                )}
            </button>
        </div>
    );
}
