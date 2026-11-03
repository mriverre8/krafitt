/**
 * What a number box reads back under its number and on its axis: seconds as
 * minutes, 0 kg as bodyweight. Goes straight after the input, inside a
 * `relative note-box` parent: globals.css lifts the number to make room, so
 * the two read as one figure rather than a note pinned to a corner.
 *
 * Hidden from assistive tech: the box already announces its own value, and the
 * note only says it again in other words.
 */
export function BoxNote({ children }: { children: string }) {
    return (
        <span
            aria-hidden
            data-note
            className="font-display text-muted pointer-events-none absolute inset-x-0 bottom-1.5 text-center text-[10px] leading-none font-bold tracking-[0.12em] uppercase"
        >
            {children}
        </span>
    );
}
