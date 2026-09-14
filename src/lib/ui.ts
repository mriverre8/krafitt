// Shared class strings, so every form and button in the app looks the same.
// Hover always pairs with an :active state (.lift in globals.css): a touch
// screen has no hover, so it can never be the only feedback.
//
// Geometry is deliberately tight — 6-8px radii, 2px rules — because soft
// rounded cards read as "wellness" and this is a barbell app.

// Width lives outside the field styling: a row that sizes its own columns
// cannot win against a w-full baked into the shared string.
//
// text-sm below md is only safe because layout.tsx pins maximumScale to 1 —
// iOS Safari auto-zooms into any focused field under 16px otherwise.
const fieldBase =
    'rounded-md border-2 bg-surface2 px-3 py-2.5 text-sm md:text-base font-medium text-ink ' +
    'transition-colors placeholder:text-muted placeholder:font-normal ' +
    'focus:border-pulse focus:outline-none disabled:opacity-30';

export const fieldClass = `${fieldBase} border-line hover:border-muted`;

/** The same field, flagged as wrong. The border colour is swapped, not added:
    two border-colour utilities on one element and the winner comes down to the
    order Tailwind emits them, which is not the order they are written in. */
export const wrongFieldClass = `${fieldBase} border-danger hover:border-danger`;

export const inputClass = `w-full min-w-0 ${fieldClass}`;
export const wrongInputClass = `w-full min-w-0 ${wrongFieldClass}`;

/** The one field that titles the card it sits in, rather than collecting a
    value inside it: no box and no fill, just a rule underneath. `ruled`
    (globals.css) stands the shared focus ring down — a ring would draw the
    rectangle this field exists to not have — and the rule going pulse is the
    focus indicator in its place. */
const titleBase =
    'ruled w-full min-w-0 border-b-2 bg-transparent px-0 py-1.5 text-ink ' +
    'transition-colors placeholder:text-muted placeholder:font-normal ' +
    'focus:border-pulse focus:outline-none disabled:opacity-30';

/** Rests a step darker than a boxed field does: `line` is an edge between two
    surfaces, and with no box around it this rule has to read on its own as a
    line you write on. */
export const titleInputClass = `${titleBase} border-muted hover:border-ink`;
export const wrongTitleInputClass = `${titleBase} border-danger hover:border-danger`;

/** The one button that means "go". Volt only ever appears as a fill. */
export const primaryClass =
    'lift charged rounded-md bg-volt px-5 py-3 font-display text-lg font-extrabold uppercase ' +
    'tracking-wide text-on-volt hover:bg-volt2 disabled:pointer-events-none ' +
    'disabled:opacity-40';

/** The filled button for a move nothing brings back. Same geometry as the ghost
    it stands next to, so a pair of them ends on one line and one height —
    danger is the only difference, and the only place the app fills with it. */
export const dangerClass =
    'lift rounded-md bg-danger px-4 py-2.5 font-display text-sm font-bold uppercase ' +
    'tracking-wide text-on-danger hover:bg-danger/85 disabled:pointer-events-none ' +
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

/** A count read off the app rather than written by it — "day 4 of 24", a week's
    tally. Tabular figures, so a number that ticks up does not shuffle the line. */
export const figureClass = 'figure text-muted text-sm';

/** The volt edge on the one routine being trained. Doubles the shared card's
    left rule as well as colouring it: on a list of cards the width is what the
    eye catches before the colour. */
export const accentClass = 'border-l-volt border-l-[6px]';

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

/** The dashed box that stands in for a list with nothing in it. Dashed rather
    than solid: a card outline would read as something that is there. */
export const emptyBoxClass =
    'border-line text-muted rounded-md border-2 border-dashed p-6 text-center';

/** The same box at the size the rest of the app's secondary copy is set in. */
export const emptyClass = `${emptyBoxClass} text-sm`;

/** One row of a dropdown panel, wherever the panel hangs from. */
export const menuItemClass =
    'flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold ' +
    'text-muted transition-colors hover:bg-surface2 hover:text-pulse';

/** An app link in the bar. */
export const navLinkClass =
    'flex items-center gap-1.5 font-display text-sm md:text-base font-bold uppercase tracking-wide ' +
    'text-muted transition-colors hover:text-pulse';

/** A legal link in the footer. 44px of target on its own line. */
export const legalLinkClass =
    'eyebrow text-muted hover:text-pulse inline-flex min-h-11 items-center transition-colors';

/** Default for a button that fires an action and has no shell of its own. */
export const subtleButtonClass =
    'text-sm font-semibold text-muted transition-colors hover:text-pulse';

// ---------- the exercise editor's set rows ----------

/** One height for everything on a set row, so the row ends flat whatever mix of
    boxes the rep mode puts in it. */
export const rowFieldClass = 'h-12';

/** How a number box looks. How it takes its width is left to the caller: the
    reps share out their slot, the drop or rest-pause value takes the line. */
export const numberClass = (wrong: boolean) =>
    `${wrong ? wrongFieldClass : fieldClass} ${rowFieldClass} min-w-0 ` +
    `px-1 text-center md:px-3`;

/** The reps are one column from md up, whatever the mode puts in it: two boxes
    for a range, one wide box for a fixed count, a dash for AMRAP. The width is
    held so the technique column lines up across rows, and a field the mode does
    not need is gone rather than an invisible box leaving a hole.

    On a phone a working set has the line to itself and its reps take the rest
    of it. A drop or rest-pause set shares that line with its own value, so
    there the reps take everything the fixed value box leaves: same width on
    every one of those rows, and the line ends flush on any screen.

    `min-w-0` is what makes that second case work. A flex item's automatic
    minimum is its content, and for a box holding `<input>`s that is their
    intrinsic ~170px each — so a range would blow the row open and push the
    value onto a line of its own however little the reps were given. */
export const repsSlotClass = (sub: boolean) =>
    sub
        ? 'flex min-w-0 flex-1 gap-1.5 md:w-48 md:flex-none md:gap-2'
        : 'contents md:flex md:w-48 md:shrink-0 md:gap-2';

/** Joins the two boxes of a range, so the pair reads as one prescription
    instead of two loose numbers. */
export const rangeJoinClass = 'text-muted shrink-0 self-center text-sm';

/** A row action worded rather than drawn: adding a drop set has no icon anyone
    would read, so these say what they do. */
export const rowButtonClass = `${labelClass} flex items-center gap-1.5 py-1 transition-colors disabled:opacity-30`;

/** Rest, then three steps of volt, for the training year. A worked day is
    around 15-20 sets, so the steps sit either side of that: a short session, a
    normal one, a long one. */
export const yearFillClasses = [
    'bg-surface2',
    'bg-volt/30',
    'bg-volt/65',
    'bg-volt',
];
