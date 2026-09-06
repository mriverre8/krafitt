"use client";

import { useT } from "@/i18n/useT";
import { setPreferenceCookie } from "@/lib/cookies";
import { THEME_COOKIE, type Theme } from "@/lib/theme";
import { useState } from "react";

/**
 * Flips the <html> class straight away and stores the choice in a cookie so the
 * server renders the same theme on the next request.
 */
export function ThemeToggle({ theme }: { theme: Theme }) {
  const t = useT();
  const [current, setCurrent] = useState<Theme>(theme);

  function toggle() {
    const next: Theme = current === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    setPreferenceCookie(THEME_COOKIE, next);
    setCurrent(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("nav.theme")}
      className="rounded-lg border border-line px-2 py-1 text-xs transition hover:border-blaze"
    >
      {current === "dark" ? "☀" : "☾"}
    </button>
  );
}
