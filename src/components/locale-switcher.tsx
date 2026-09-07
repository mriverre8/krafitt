"use client";

import { LOCALE_COOKIE, LOCALES, type Locale } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/use-t";
import { setPreferenceCookie } from "@/lib/cookies";
import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";

/** Server components render the copy, so changing locale needs a refresh. */
export function LocaleSwitcher() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();

  function select(next: Locale) {
    setPreferenceCookie(LOCALE_COOKIE, next);
    router.refresh();
  }

  return (
    <div role="group" aria-label={t("nav.language")} className="flex items-center gap-1">
      <Languages size={14} aria-hidden className="text-muted" />
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => select(option)}
          aria-pressed={option === locale}
          className={`rounded-lg px-1.5 py-1 text-xs font-semibold uppercase transition-colors ${
            option === locale ? "bg-blaze text-on-accent" : "text-muted hover:text-ink"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
