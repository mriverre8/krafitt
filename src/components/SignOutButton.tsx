"use client";

import { useT } from "@/i18n/useT";
import { authClient } from "@/lib/auth-client";
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
      className="text-[11px] font-bold uppercase tracking-widest text-muted transition hover:text-blaze"
    >
      {t("nav.signOut")}
    </button>
  );
}
