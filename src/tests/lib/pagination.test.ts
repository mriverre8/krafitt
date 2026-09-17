import { PAGE_SIZE, paginate } from '@/lib/pagination';
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
