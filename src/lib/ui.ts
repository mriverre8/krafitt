// Shared class strings, so every form and button in the app looks the same.
// Hover always pairs with an :active state (.lift in globals.css): a touch
// screen has no hover, so it can never be the only feedback.
//
// Geometry is deliberately tight — 6-8px radii, 2px rules — because soft
// rounded cards read as "wellness" and this is a barbell app.

// Width lives outside the field styling: a row that sizes its own columns
// cannot win against a w-full baked into the shared string.
const fieldBase =
    'rounded-md border-2 bg-surface2 px-3 py-2.5 text-sm font-medium text-ink ' +
    'transition-colors placeholder:text-muted placeholder:font-normal ' +
    'focus:border-pulse focus:outline-none disabled:opacity-30';

export const fieldClass = `${fieldBase} border-line hover:border-muted`;

/** The same field, flagged as wrong. The border colour is swapped, not added:
    two border-colour utilities on one element and the winner comes down to the
    order Tailwind emits them, which is not the order they are written in. */
export const wrongFieldClass = `${fieldBase} border-danger hover:border-danger`;

export const inputClass = `w-full min-w-0 ${fieldClass}`;
export const wrongInputClass = `w-full min-w-0 ${wrongFieldClass}`;

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

/** The × that drops a row, exercise or set alike. One size for both, so the
    fields they sit next to end on the same edge instead of a few pixels apart.
    A finger-sized box on a phone; from md up a mouse can have the tight one. */
export const removeButtonClass =
    'flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md ' +
    'text-muted transition-colors hover:text-danger disabled:opacity-30 ' +
    'md:min-h-0 md:min-w-0 md:p-1.5';

/** Small text button, for destructive or secondary row actions. Same story:
    44px of target on a phone, back to its own size once there is a pointer. */
export const iconButtonClass =
    'flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-md ' +
    'p-2 text-muted transition-colors hover:bg-surface2 hover:text-pulse ' +
    'md:min-h-0 md:min-w-0';

/** Uppercase pill, for a count or a status. */
export const badgeClass =
    'eyebrow inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1.5';
