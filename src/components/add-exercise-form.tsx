"use client";

import { useT } from "@/i18n/use-t";
import type { FormAction } from "@/lib/forms";
import { inputClass, primaryClass } from "@/lib/ui";
import { Plus } from "lucide-react";
import { useActionState, useId } from "react";
import { FormError } from "./form-error";

export function AddExerciseForm({ action, workoutId }: { action: FormAction; workoutId: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState(action, {});
  const techniqueListId = useId();

  return (
    <form action={formAction} className="space-y-2 rounded-xl border border-line bg-surface2 p-3">
      <input type="hidden" name="workoutId" value={workoutId} />
      <input
        name="name"
        aria-label={t("exercise.nameLabel")}
        placeholder={t("exercise.namePlaceholder")}
        className={inputClass}
      />
      <div className="grid grid-cols-4 gap-2">
        <input
          name="sets"
          type="number"
          min="1"
          max="20"
          defaultValue={4}
          aria-label={t("exercise.sets")}
          className={inputClass}
        />
        <input
          name="repMin"
          type="number"
          min="1"
          defaultValue={6}
          aria-label={t("exercise.repMin")}
          className={inputClass}
        />
        <input
          name="repMax"
          type="number"
          min="1"
          defaultValue={8}
          aria-label={t("exercise.repMax")}
          className={inputClass}
        />
        <input
          name="targetWeight"
          type="number"
          min="0"
          step="0.5"
          placeholder={t("today.kg")}
          aria-label={t("exercise.weight")}
          className={inputClass}
        />
      </div>
      <input
        name="technique"
        list={techniqueListId}
        aria-label={t("exercise.technique")}
        placeholder={t("exercise.techniquePlaceholder")}
        className={inputClass}
      />
      <datalist id={techniqueListId}>
        <option value={t("technique.linear")} />
        <option value={t("technique.topset")} />
        <option value={t("technique.backoff")} />
        <option value={t("technique.dropset")} />
      </datalist>
      <FormError message={state.error} />
      <button
        type="submit"
        disabled={pending}
        className={`${primaryClass} flex w-full items-center justify-center gap-2`}
      >
        <Plus size={16} aria-hidden />
        {t("exercise.add")}
      </button>
    </form>
  );
}
