/**
 * Moving things up and down a list — the days in their modal, the exercises
 * of a day — as a slide rather than a jump: a view transition, in which each
 * element carrying a `view-transition-name` (and the `swap` class the timing
 * hangs off, in globals.css) moves from its old place to its new one.
 *
 * `update` must put the new order in the DOM before it returns — a state
 * change inside `flushSync` — and do whatever follows it there too, focus
 * included, so the new picture is taken with it in place. Nothing scrolls:
 * the list moves, the page does not.
 *
 * Where the browser has no view transitions, or the visitor has asked for less
 * motion, `update` simply runs. The promise settles once it is all over, for
 * names that only stand for the length of the move.
 */
export function swap(update: () => void): Promise<void> {
    const still = window.matchMedia?.(
        '(prefers-reduced-motion: reduce)'
    ).matches;
    if (!document.startViewTransition || still) {
        update();
        return Promise.resolve();
    }
    // The page around the moving rows is not part of the move: globals.css
    // shows its new picture at once while this is set, with no cross-fade.
    const root = document.documentElement;
    root.dataset.swap = '';
    return document
        .startViewTransition(update)
        .finished.catch(() => {})
        .finally(() => delete root.dataset.swap);
}
