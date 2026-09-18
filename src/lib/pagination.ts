/**
 * Page maths, shared by the screens that page a list and by `Pagination`. The
 * page itself lives in the URL, so it arrives as whatever a user typed there.
 */

/** Rows per page. One number for every list: they all show the same card. */
export const PAGE_SIZE = 10;

/**
 * The page the URL asks for, clamped to the pages that exist. Anything else —
 * no param, a word, a negative, a page past the end after a routine was
 * deleted — lands on the first page rather than on an empty list.
 */
export function paginate(value: string | string[] | undefined, total: number) {
    const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
    const asked = Number(Array.isArray(value) ? value[0] : value);
    const page = Number.isInteger(asked)
        ? Math.min(Math.max(asked, 1), totalPages)
        : 1;

    return { page, totalPages, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE };
}

/** Rows a follows list starts with, and grows by. */
export const LOAD_SIZE = 50;

/**
 * The app's other way through a list: everything from the top, growing by
 * `LOAD_SIZE` each time the button is pressed rather than swapping one page for
 * the next. The count still lives in the URL, so a reload keeps what was loaded
 * and the back button walks it down again.
 *
 * `next` is what the button asks for, or null once the list is all on screen.
 */
export function loadMore(value: string | string[] | undefined, total: number) {
    const asked = Number(Array.isArray(value) ? value[0] : value);
    const shown = Math.min(
        Number.isInteger(asked) ? Math.max(asked, LOAD_SIZE) : LOAD_SIZE,
        total
    );

    return { shown, next: shown < total ? shown + LOAD_SIZE : null };
}
