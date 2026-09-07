"use client";

import { useT } from "@/i18n/useT";
import { CalendarDays, ClipboardList, Dumbbell } from "lucide-react";
import { AuthForms } from "./AuthForms";

const FEATURES = [
  ["landing.feature1", ClipboardList],
  ["landing.feature2", CalendarDays],
  ["landing.feature3", Dumbbell],
] as const;

export function Landing() {
  const t = useT();

  return (
    <div className="space-y-8 py-4">
      <div className="space-y-4 text-center">
        <h1 className="display text-6xl">
          Kra<span className="text-blaze">fitt</span>
        </h1>
        <p className="mx-auto max-w-md text-muted">{t("app.tagline")}</p>
      </div>

      <ul className="grid gap-2">
        {FEATURES.map(([key, Icon]) => (
          <li
            key={key}
            className="flex gap-3 rounded-2xl border border-line bg-surface p-4 text-sm text-muted"
          >
            <Icon size={22} aria-hidden className="shrink-0 self-center text-blaze" />
            <span className="self-center">{t(key)}</span>
          </li>
        ))}
      </ul>

      <AuthForms />
    </div>
  );
}
