"use client";

import { useT } from "@/i18n/useT";
import type { SetValue } from "@/lib/progress";
import { inputClass } from "@/lib/ui";
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";

export function SetRow({
  setIndex,
  enabled,
  saved,
  previous,
  previousWeek,
  onSave,
}: {
  setIndex: number;
  enabled: boolean;
  saved?: SetValue;
  previous?: SetValue;
  previousWeek: number | null;
  onSave: (weight: number, reps: number) => void;
}) {
  const t = useT();
  const number = setIndex + 1;

  // No syncing effect: the draft wins, and without one we show what is stored.
  const [draft, setDraft] = useState<{ weight: string; reps: string } | null>(null);
  const weight = draft?.weight ?? (saved ? String(saved.weight) : "");
  const reps = draft?.reps ?? (saved ? String(saved.reps) : "");

  const parsedWeight = Number(weight);
  const parsedReps = Number.parseInt(reps, 10);
  const canSave =
    enabled &&
    weight.trim() !== "" &&
    reps.trim() !== "" &&
    Number.isFinite(parsedWeight) &&
    parsedWeight >= 0 &&
    parsedReps > 0 &&
    (!saved || saved.weight !== parsedWeight || saved.reps !== parsedReps);
  const done = !!saved && !canSave;

  // The left rule is the state: quiet when locked, orange when it is your turn,
  // green once the set is banked.
  return (
    <div
      className={`flex items-center gap-2 border-l-2 pl-2.5 transition-colors ${
        done ? "border-surge" : enabled ? "border-blaze" : "border-line"
      }`}
    >
      <span className={`figure w-5 shrink-0 text-lg ${done ? "text-surge" : "text-muted"}`}>
        <span className="sr-only">{t("today.set", { n: number })}</span>
        <span aria-hidden>{number}</span>
      </span>
      <span className="w-16 shrink-0 text-xs tabular-nums text-muted">
        {previous && previousWeek !== null
          ? t("today.previous", {
              week: previousWeek,
              weight: previous.weight,
              reps: previous.reps,
            })
          : t("today.noPrevious")}
      </span>
      <input
        type="number"
        inputMode="decimal"
        step="0.5"
        min="0"
        placeholder={t("today.kg")}
        aria-label={t("today.weightLabel", { n: number })}
        disabled={!enabled}
        value={weight}
        onChange={(event) => setDraft({ weight: event.target.value, reps })}
        className={`${inputClass} figure text-center text-base`}
      />
      <input
        type="number"
        inputMode="numeric"
        min="1"
        placeholder={t("today.reps")}
        aria-label={t("today.repsLabel", { n: number })}
        disabled={!enabled}
        value={reps}
        onChange={(event) => setDraft({ weight, reps: event.target.value })}
        className={`${inputClass} figure text-center text-base`}
      />
      <button
        type="button"
        disabled={!canSave}
        onClick={() => onSave(parsedWeight, parsedReps)}
        aria-label={t("today.saveLabel", { n: number })}
        data-done={done}
        // A banked set keeps its green even though the button is done and
        // disabled; a locked one goes neutral, because faded orange turns muddy.
        className={`lift grid w-11 shrink-0 place-items-center rounded-xl py-2.5 disabled:pointer-events-none ${
          done
            ? "bg-surge text-on-accent"
            : "bg-blaze text-on-accent hover:bg-ember disabled:bg-surface2 disabled:text-muted"
        }`}
      >
        {done ? <Check size={16} aria-hidden /> : <ArrowRight size={16} aria-hidden />}
      </button>
    </div>
  );
}
