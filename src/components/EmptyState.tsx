"use client";

import { useT } from "@/i18n/useT";
import { primaryClass } from "@/lib/ui";
import Link from "next/link";

export function EmptyState({ title, body }: { title: string; body: string }) {
  const t = useT();

  return (
    <div className="rounded-2xl border border-line bg-surface p-8 text-center">
      <h1 className="display text-3xl">{title}</h1>
      <p className="mx-auto mt-3 max-w-sm text-sm text-muted">{body}</p>
      <Link href="/routines" className={`${primaryClass} mt-5 inline-block`}>
        {t("home.goToRoutines")}
      </Link>
    </div>
  );
}
