// Shared class strings, so every form and button in the app looks the same.
// Hover always pairs with an :active state (.lift in globals.css): a touch
// screen has no hover, so it can never be the only feedback.
//
// Geometry is deliberately tight — 6-8px radii, 2px rules — because soft
// rounded cards read as "wellness" and this is a barbell app.

// Width lives outside the field styling: a row that sizes its own columns
// cannot win against a w-full baked into the shared string.
export const fieldClass =
    'rounded-md border-2 border-line bg-surface2 px-3 py-2.5 text-sm font-medium text-ink ' +
    'transition-colors placeholder:text-muted placeholder:font-normal hover:border-muted ' +
    'focus:border-pulse focus:outline-none disabled:opacity-30';

export const inputClass = `w-full min-w-0 ${fieldClass}`;

/** The one button that means "go". Volt only ever appears as a fill. */
export const primaryClass =
    'lift charged rounded-md bg-volt px-5 py-3 font-display text-lg font-extrabold uppercase ' +
    'tracking-wide text-on-volt hover:bg-volt2 disabled:pointer-events-none ' +
    'disabled:opacity-40';

export const ghostClass =
    'lift rounded-md border-2 border-line px-4 py-2.5 font-display text-sm font-bold uppercase ' +
    'tracking-wide text-muted hover:border-pulse hover:text-pulse ' +
    'disabled:pointer-events-none disabled:opacity-40';

/** Every panel wears the same thick left rule: it is the app's one ornament,
    and a card that swaps its colour reads as active/done before any text does. */
export const cardClass =
    'rounded-md border border-line border-l-[3px] bg-surface p-4';

/** Interactive card: same shell, plus the app's hover language. */
export const cardLinkClass = `${cardClass} lift hover:border-pulse`;

export const labelClass = 'eyebrow text-muted';

/** Small text button, for destructive or secondary row actions. */
export const iconButtonClass =
    'rounded-md p-2 text-muted transition-colors hover:bg-surface2 hover:text-pulse';

/** Uppercase pill, for a count or a status. */
export const badgeClass =
    'eyebrow inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5';
