"use client";

import { LOCALE_COOKIE, LOCALES, type Locale } from "@/i18n/config";
import { useLocale, useT } from "@/i18n/useT";
import { setPreferenceCookie } from "@/lib/cookies";
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
    <div role="group" aria-label={t("nav.language")} className="flex gap-1">
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => select(option)}
          aria-pressed={option === locale}
          className={`rounded-lg px-1.5 py-1 text-[11px] font-bold uppercase transition ${
            option === locale ? "bg-blaze text-white" : "text-muted hover:text-ink"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
