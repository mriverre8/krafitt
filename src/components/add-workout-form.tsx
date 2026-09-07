"use client";

import { useT } from "@/i18n/use-t";
import type { FormAction } from "@/lib/forms";
import { ghostClass, inputClass } from "@/lib/ui";
import { Plus } from "lucide-react";
import { useActionState } from "react";
import { FormError } from "./form-error";

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
        <button
          type="submit"
          disabled={pending}
          className={`${ghostClass} flex shrink-0 items-center gap-1.5`}
        >
          <Plus size={14} aria-hidden />
          {t("routine.addDay")}
        </button>
      </div>
      <FormError message={state.error} />
    </form>
  );
}
