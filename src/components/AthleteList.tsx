"use client";

import { useT } from "@/i18n/useT";
import { ActionButton } from "./ActionButton";

export type AthleteView = {
  userId: string;
  name: string;
  email: string;
  canEdit: boolean;
  isOwner: boolean;
};

export function AthleteList({
  athletes,
  viewerIsOwner,
  onToggleEdit,
  onRemove,
}: {
  athletes: AthleteView[];
  viewerIsOwner: boolean;
  onToggleEdit: (userId: string, canEdit: boolean) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}) {
  const t = useT();

  return (
    <ul className="space-y-2 text-sm">
      {athletes.map((athlete) => (
        <li key={athlete.userId} className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate">
            {athlete.name || athlete.email}
            <span className="text-muted">
              {athlete.isOwner
                ? ` · ${t("athletes.owner")}`
                : athlete.canEdit
                  ? ` · ${t("athletes.editor")}`
                  : ""}
            </span>
          </span>

          {viewerIsOwner && !athlete.isOwner && (
            <span className="flex shrink-0 gap-3">
              <ActionButton action={() => onToggleEdit(athlete.userId, !athlete.canEdit)}>
                {athlete.canEdit ? t("athletes.revokeEdit") : t("athletes.grantEdit")}
              </ActionButton>
              <ActionButton
                action={() => onRemove(athlete.userId)}
                confirm={t("athletes.removeConfirm")}
              >
                {t("athletes.remove")}
              </ActionButton>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
