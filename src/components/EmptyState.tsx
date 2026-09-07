"use client";

import { useT } from "@/i18n/useT";
import { primaryClass } from "@/lib/ui";
import { Dumbbell } from "lucide-react";
import Link from "next/link";

export function EmptyState({ title, body }: { title: string; body: string }) {
  const t = useT();

  return (
    <div className="rounded-2xl border border-line bg-surface p-8">
      <Dumbbell size={28} aria-hidden className="text-blaze" />
      <h1 className="display mt-3 text-4xl">{title}</h1>
      <p className="mt-2 max-w-sm text-muted">{body}</p>
      <Link href="/routines" className={`${primaryClass} mt-6 inline-block`}>
        {t("home.goToRoutines")}
      </Link>
    </div>
  );
}
