"use client";

import { useT } from "@/i18n/use-t";
import { cardLinkClass } from "@/lib/ui";
import { Flame } from "lucide-react";
import Link from "next/link";
import { ActionButton } from "./action-button";
import { ProgressLadder } from "./progress-ladder";

export type RoutineCardProps = {
  id: string;
  name: string;
  durationWeeks: number;
  workoutCount: number;
  cursor: number;
  isActive: boolean;
  onSetActive: (routineId: string) => Promise<void>;
};

export function RoutineCard(props: RoutineCardProps) {
  const t = useT();
  const total = props.workoutCount * props.durationWeeks;
  const done = Math.min(props.cursor, total);
  const progress = t("routines.progress", { done, total });

  return (
    <li className={`${cardLinkClass} ${props.isActive ? "border-blaze" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/routines/${props.id}`} className="display text-2xl hover:text-blaze">
            {props.name}
          </Link>
          <p className="text-sm text-muted">
            {t("routines.meta", {
              weeks: props.durationWeeks,
              days: props.workoutCount,
            })}
          </p>
        </div>

        {props.isActive ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-blaze px-3 py-1 text-sm font-semibold text-on-accent">
            <Flame size={13} aria-hidden />
            {t("routines.active")}
          </span>
        ) : (
          <ActionButton
            action={() => props.onSetActive(props.id)}
            className="lift shrink-0 rounded-full border border-line px-3 py-1 text-sm font-semibold text-muted hover:border-blaze hover:text-blaze"
          >
            {t("routines.markActive")}
          </ActionButton>
        )}
      </div>

      <div className="mt-4 space-y-1.5">
        <ProgressLadder done={done} total={total} label={progress} />
        <p className="figure text-sm text-muted">{progress}</p>
      </div>
    </li>
  );
}
