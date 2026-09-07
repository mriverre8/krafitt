"use client";

import { useT } from "@/i18n/use-t";
import type { Theme } from "@/lib/theme";
import { CalendarDays, Dumbbell } from "lucide-react";
import Link from "next/link";
import { LocaleSwitcher } from "./locale-switcher";
import { SignOutButton } from "./sign-out-button";
import { ThemeToggle } from "./theme-toggle";

export function NavBar({ signedIn, theme }: { signedIn: boolean; theme: Theme }) {
  const t = useT();

  return (
    <nav className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
      <Link href="/" className="display text-3xl text-ink transition-colors hover:text-blaze">
        Kra<span className="text-blaze">fitt</span>
      </Link>

      <div className="flex items-center gap-3">
        {signedIn && (
          <>
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-blaze"
            >
              <CalendarDays size={14} aria-hidden />
              {t("nav.today")}
            </Link>
            <Link
              href="/routines"
              className="flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-blaze"
            >
              <Dumbbell size={14} aria-hidden />
              {t("nav.routines")}
            </Link>
            <SignOutButton />
          </>
        )}
        <LocaleSwitcher />
        <ThemeToggle theme={theme} />
      </div>
    </nav>
  );
}
