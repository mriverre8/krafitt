"use client";

import { useT } from "@/i18n/useT";
import { authClient } from "@/lib/auth-client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const t = useT();
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await authClient.signOut();
        router.refresh();
      }}
      aria-label={t("nav.signOut")}
      title={t("nav.signOut")}
      className="text-muted transition hover:text-blaze"
    >
      <LogOut size={16} aria-hidden />
    </button>
  );
}
