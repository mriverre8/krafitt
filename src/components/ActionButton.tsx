"use client";

import { useTransition } from "react";

/** Button that fires a server action already bound to its arguments. */
export function ActionButton({
  action,
  children,
  className = "text-[11px] font-bold uppercase tracking-widest text-muted transition hover:text-blaze",
  confirm,
}: {
  action: () => Promise<unknown>;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={`${className} disabled:opacity-40`}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        startTransition(async () => {
          await action();
        });
      }}
    >
      {children}
    </button>
  );
}
