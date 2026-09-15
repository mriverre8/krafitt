import { Pagination } from '@/components/ui/pagination';
import { PAGE_SIZE, paginate } from '@/lib/pagination';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithLocale } from './setup-helpers';

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

describe('Pagination', () => {
    it('stays out of the way while everything fits on one page', () => {
        const { container } = renderWithLocale(
            <Pagination
                page={1}
                totalPages={1}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('steps either way, on the param it is given', () => {
        renderWithLocale(
            <Pagination
                page={2}
                totalPages={3}
                param="finished"
            />
        );
        expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute(
            'href',
            '?finished=1'
        );
        expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
            'href',
            '?finished=3'
        );
        expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    });

    it('drops the link off the end it is sitting on', () => {
        renderWithLocale(
            <Pagination
                page={1}
                totalPages={2}
            />
        );
        expect(screen.queryByRole('link', { name: 'Previous' })).toBeNull();
        expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
            'href',
            '?page=2'
        );
    });
});
