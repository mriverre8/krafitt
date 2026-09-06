"use client";

import { useT } from "@/i18n/useT";
import Link from "next/link";
import { ActionButton } from "./ActionButton";

export type RoutineCardProps = {
  id: string;
  name: string;
  durationWeeks: number;
  workoutCount: number;
  memberCount: number;
  cursor: number;
  isActive: boolean;
  isOwner: boolean;
  canEdit: boolean;
  onSetActive: (routineId: string) => Promise<void>;
};

export function RoutineCard(props: RoutineCardProps) {
  const t = useT();
  const total = props.workoutCount * props.durationWeeks;
  const done = Math.min(props.cursor, total);
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <li
      className={`rounded-2xl border bg-surface p-4 ${
        props.isActive ? "border-blaze" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/routines/${props.id}`} className="display text-xl hover:text-blaze">
            {props.name}
          </Link>
          <p className="text-xs text-muted">
            {t("routines.meta", {
              weeks: props.durationWeeks,
              days: props.workoutCount,
              athletes: props.memberCount,
            })}
          </p>
          <p className="text-xs text-muted">
            {props.isOwner ? t("routines.yours") : props.canEdit ? t("routines.editor") : ""}
          </p>
        </div>

        {props.isActive ? (
          <span className="shrink-0 rounded-full bg-blaze px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
            {t("routines.active")}
          </span>
        ) : (
          <ActionButton
            action={() => props.onSetActive(props.id)}
            className="shrink-0 rounded-full border border-line px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-muted transition hover:border-blaze hover:text-blaze"
          >
            {t("routines.markActive")}
          </ActionButton>
        )}
      </div>

      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blaze to-ember"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-muted">
          {t("routines.progress", { done, total })}
        </p>
      </div>
    </li>
  );
}
