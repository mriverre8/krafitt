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
