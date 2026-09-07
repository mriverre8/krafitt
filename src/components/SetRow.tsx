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

  return (
    <div className="flex items-center gap-2">
      <span className={`w-12 shrink-0 text-[11px] font-bold uppercase tracking-wider ${done ? "text-volt" : "text-muted"}`}>
        {t("today.set", { n: number })}
      </span>
      <span className="w-20 shrink-0 text-[11px] tabular-nums text-muted">
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
        className={`${inputClass} text-center tabular-nums`}
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
        className={`${inputClass} text-center tabular-nums`}
      />
      <button
        type="button"
        disabled={!canSave}
        onClick={() => onSave(parsedWeight, parsedReps)}
        aria-label={t("today.saveLabel", { n: number })}
        data-done={done}
        className={`grid w-10 shrink-0 place-items-center rounded-xl py-2.5 transition disabled:opacity-30 ${
          done ? "bg-volt text-black" : "bg-blaze text-white"
        }`}
      >
        {done ? <Check size={16} aria-hidden /> : <ArrowRight size={16} aria-hidden />}
      </button>
    </div>
  );
}
