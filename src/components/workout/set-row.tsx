'use client';

import { useT } from '@/i18n/use-t';
import type { PreviousValue, SetValue } from '@/lib/progress';
import { REPS, WEIGHT } from '@/lib/constants';
import { inputClass } from '@/lib/ui';
import { ArrowRight, Check } from 'lucide-react';
import { useState } from 'react';

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
    onSave: (weight: number, reps: number) => void;
}) {
    const t = useT();
    const shown = label ?? String(setIndex + 1);
    const number = name ?? shown;

    // No syncing effect: the draft wins, and without one we show what is stored.
    const [draft, setDraft] = useState<{ weight: string; reps: string } | null>(
        null
    );
    const weight = draft?.weight ?? (saved ? String(saved.weight) : '');
    const reps = draft?.reps ?? (saved ? String(saved.reps) : '');

    const parsedWeight = Number(weight);
    const parsedReps = Number.parseInt(reps, 10);
    const canSave =
        enabled &&
        weight.trim() !== '' &&
        reps.trim() !== '' &&
        Number.isFinite(parsedWeight) &&
        parsedWeight >= 0 &&
        parsedReps > 0 &&
        (!saved || saved.weight !== parsedWeight || saved.reps !== parsedReps);
    const done = !!saved && !canSave;

    return (
        <div
            className={`flex items-center gap-2 border-l-4 pl-3 transition-colors ${
                done ? 'border-surge' : enabled ? 'border-volt' : 'border-line'
            }`}
        >
            <span
                className={`figure w-9 shrink-0 ${sub ? 'text-sm' : 'text-xl'} ${
                    done ? 'text-surge' : enabled ? 'text-ink' : 'text-muted'
                }`}
            >
                <span className="sr-only">{t('today.set', { n: number })}</span>
                <span aria-hidden>{shown}</span>
            </span>
            <span className="text-muted w-16 shrink-0 text-xs tabular-nums md:text-sm">
                {previous
                    ? t('today.previous', {
                          week: previous.week,
                          weight: previous.weight,
                          reps: previous.reps,
                      })
                    : t('today.noPrevious')}
            </span>
            <input
                type="number"
                inputMode="decimal"
                step={WEIGHT.step}
                min={WEIGHT.min}
                max={WEIGHT.max}
                placeholder={t('today.kg')}
                aria-label={t('today.weightLabel', { n: number })}
                disabled={!enabled}
                value={weight}
                onChange={(event) =>
                    setDraft({ weight: event.target.value, reps })
                }
                className={`${inputClass} figure h-12 text-center text-lg`}
            />
            <input
                type="number"
                inputMode="numeric"
                min={REPS.min}
                max={REPS.max}
                placeholder={t('today.reps')}
                aria-label={t('today.repsLabel', { n: number })}
                disabled={!enabled}
                value={reps}
                onChange={(event) =>
                    setDraft({ weight, reps: event.target.value })
                }
                className={`${inputClass} figure h-12 text-center text-lg`}
            />
            <button
                type="button"
                disabled={!canSave}
                onClick={() => onSave(parsedWeight, parsedReps)}
                aria-label={t('today.saveLabel', { n: number })}
                data-done={done}
                className={`lift grid h-12 w-12 shrink-0 place-items-center rounded-md disabled:pointer-events-none ${
                    done
                        ? 'bg-surge text-on-surge'
                        : 'charged bg-volt text-on-volt hover:bg-volt2 disabled:bg-surface2 disabled:text-muted'
                }`}
            >
                {done ? (
                    <Check
                        size={20}
                        aria-hidden
                    />
                ) : (
                    <ArrowRight
                        size={20}
                        aria-hidden
                    />
                )}
            </button>
        </div>
    );
}
