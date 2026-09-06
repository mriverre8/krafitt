"use client";

import { useT } from "@/i18n/useT";
import type { FormAction } from "@/lib/forms";
import { inputClass, primaryClass } from "@/lib/ui";
import { useActionState } from "react";
import { FormError } from "./FormError";

export function AddAthleteForm({ action, routineId }: { action: FormAction; routineId: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="routineId" value={routineId} />
      <input
        name="email"
        type="email"
        aria-label={t("athletes.emailLabel")}
        placeholder={t("athletes.emailPlaceholder")}
        className={inputClass}
      />
      <label className="flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" name="canEdit" className="accent-blaze" />
        {t("athletes.canEdit")}
      </label>
      <FormError message={state.error} />
      <button type="submit" disabled={pending} className={`${primaryClass} w-full`}>
        {t("athletes.add")}
      </button>
    </form>
  );
}
