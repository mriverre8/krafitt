"use client";

import { useT } from "@/i18n/useT";
import type { Theme } from "@/lib/theme";
import Link from "next/link";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { SignOutButton } from "./SignOutButton";
import { ThemeToggle } from "./ThemeToggle";

export function NavBar({ signedIn, theme }: { signedIn: boolean; theme: Theme }) {
  const t = useT();

  return (
    <nav className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
      <Link href="/" className="display text-2xl text-ink">
        Kra<span className="text-blaze">fitt</span>
      </Link>

      <div className="flex items-center gap-3">
        {signedIn && (
          <>
            <Link
              href="/"
              className="text-[11px] font-bold uppercase tracking-widest text-muted transition hover:text-blaze"
            >
              {t("nav.today")}
            </Link>
            <Link
              href="/routines"
              className="text-[11px] font-bold uppercase tracking-widest text-muted transition hover:text-blaze"
            >
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
