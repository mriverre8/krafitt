import { LOAD_SIZE, loadMore, PAGE_SIZE, paginate } from '@/lib/pagination';
import { describe, expect, it } from 'vitest';

describe('paginate', () => {
    it('cuts the list into pages', () => {
        expect(paginate('2', PAGE_SIZE * 3)).toEqual({
            page: 2,
            totalPages: 3,
            skip: PAGE_SIZE,
            take: PAGE_SIZE,
        });
    });

    it('leaves one page for a list that does not fill one, empty included', () => {
        expect(paginate(undefined, 0).totalPages).toBe(1);
        expect(paginate(undefined, 1).totalPages).toBe(1);
        expect(paginate(undefined, PAGE_SIZE + 1).totalPages).toBe(2);
    });

    it('clamps anything the URL can carry into a page that exists', () => {
        const total = PAGE_SIZE * 2;
        expect(paginate('9', total).page).toBe(2);
        expect(paginate('-3', total).page).toBe(1);
        expect(paginate('later', total).page).toBe(1);
        expect(paginate('1.5', total).page).toBe(1);
        expect(paginate(['3', '1'], total).page).toBe(2);
    });
});

describe('loadMore', () => {
    it('starts at one load, and asks for one more', () => {
        expect(loadMore(undefined, 200)).toEqual({
            shown: LOAD_SIZE,
            next: LOAD_SIZE * 2,
        });
    });

    it('grows by a load at a time', () => {
        expect(loadMore(String(LOAD_SIZE * 2), 200)).toEqual({
            shown: LOAD_SIZE * 2,
            next: LOAD_SIZE * 3,
        });
    });

    // The URL is whatever someone typed there: a huge number must not turn into
    // a huge take, and a small or junk one must not shrink the first load.
    it('clamps to the list it is paging', () => {
        expect(loadMore('99999', 60)).toEqual({ shown: 60, next: null });
        expect(loadMore('3', 200)).toEqual({
            shown: LOAD_SIZE,
            next: LOAD_SIZE * 2,
        });
        expect(loadMore('soon', 200)).toEqual({
            shown: LOAD_SIZE,
            next: LOAD_SIZE * 2,
        });
    });

    it('has nothing more to load when the list fits', () => {
        expect(loadMore(undefined, 12)).toEqual({ shown: 12, next: null });
        expect(loadMore(undefined, 0)).toEqual({ shown: 0, next: null });
    });
});
