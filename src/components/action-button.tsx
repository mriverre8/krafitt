"use client";

import { useTransition } from "react";

/** Button that fires a server action already bound to its arguments. */
export function ActionButton({
  action,
  children,
  className = "text-sm font-semibold text-muted transition-colors hover:text-blaze",
  confirm,
  label,
}: {
  action: () => Promise<unknown>;
  children: React.ReactNode;
  className?: string;
  confirm?: string;
  /** Accessible name for buttons whose content is only an icon. */
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={label}
      title={label}
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
