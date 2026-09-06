"use client";

import { useT } from "@/i18n/useT";
import type { FormAction } from "@/lib/forms";
import { ghostClass, inputClass } from "@/lib/ui";
import { useActionState } from "react";
import { FormError } from "./FormError";

export function AddWorkoutForm({ action, routineId }: { action: FormAction; routineId: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex gap-2">
        <input type="hidden" name="routineId" value={routineId} />
        <input
          name="name"
          aria-label={t("routine.dayLabel")}
          placeholder={t("routine.dayPlaceholder")}
          className={inputClass}
        />
        <button type="submit" disabled={pending} className={ghostClass}>
          {t("routine.addDay")}
        </button>
      </div>
      <FormError message={state.error} />
    </form>
  );
}
