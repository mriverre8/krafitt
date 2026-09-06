"use client";

import { useT } from "@/i18n/useT";
import { AuthForms } from "./AuthForms";

const FEATURES = [
  "landing.feature1",
  "landing.feature2",
  "landing.feature3",
  "landing.feature4",
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
        {FEATURES.map((key, index) => (
          <li
            key={key}
            className="flex gap-3 rounded-2xl border border-line bg-surface p-4 text-sm text-muted"
          >
            <span className="display text-2xl text-blaze">{index + 1}</span>
            <span className="self-center">{t(key)}</span>
          </li>
        ))}
      </ul>

      <AuthForms />
    </div>
  );
}
