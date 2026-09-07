"use client";

import { useT } from "@/i18n/useT";
import { setPreferenceCookie } from "@/lib/cookies";
import { THEME_COOKIE, type Theme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";
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
      className="rounded-lg border border-line p-1.5 text-muted transition-colors hover:border-blaze hover:text-blaze"
    >
      {current === "dark" ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
    </button>
  );
}
