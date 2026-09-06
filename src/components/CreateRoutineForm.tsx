"use client";

import type { FormAction } from "@/lib/forms";
import { inputClass, labelClass, primaryClass } from "@/lib/ui";
import { useT } from "@/i18n/useT";
import { FormError } from "./FormError";
import { useActionState } from "react";

export function CreateRoutineForm({ action }: { action: FormAction }) {
  const t = useT();
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-line bg-surface p-4">
      <h2 className="display text-2xl">{t("routines.newTitle")}</h2>
      <input
        name="name"
        aria-label={t("routines.nameLabel")}
        placeholder={t("routines.namePlaceholder")}
        className={inputClass}
      />
      <label className={`block ${labelClass}`}>
        {t("routines.duration")}
        <input
          name="durationWeeks"
          type="number"
          min="1"
          max="52"
          defaultValue={8}
          className={`${inputClass} mt-1`}
        />
      </label>
      <FormError message={state.error} />
      <button type="submit" disabled={pending} className={`${primaryClass} w-full`}>
        {t("routines.create")}
      </button>
    </form>
  );
}
