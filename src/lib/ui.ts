// Shared class strings, so every form and button in the app looks the same.
// Hover always pairs with an :active state (.lift in globals.css): a touch
// screen has no hover, so it can never be the only feedback.

export const inputClass =
  "w-full min-w-0 rounded-xl border border-line bg-surface2 px-3 py-2.5 text-sm text-ink " +
  "transition-colors placeholder:text-muted hover:border-muted focus:border-blaze " +
  "focus:outline-none focus:ring-2 focus:ring-blaze/25 disabled:opacity-30";

export const primaryClass =
  "lift rounded-xl bg-blaze px-4 py-3 font-display text-base font-bold uppercase tracking-wide " +
  "text-on-accent hover:bg-ember disabled:pointer-events-none disabled:opacity-40";

export const ghostClass =
  "lift rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-muted " +
  "hover:border-blaze hover:text-blaze disabled:pointer-events-none disabled:opacity-40";

export const cardClass = "rounded-2xl border border-line bg-surface p-4";

/** Interactive card: same shell, plus the app's hover language. */
export const cardLinkClass = `${cardClass} lift hover:border-blaze`;

export const labelClass = "text-xs font-semibold text-muted";

/** Small text button, for destructive or secondary row actions. */
export const iconButtonClass =
  "rounded-lg p-1.5 text-muted transition-colors hover:bg-surface2 hover:text-blaze";
