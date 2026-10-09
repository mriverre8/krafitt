import { Pagination } from '@/components/ui/pagination';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithLocale } from '@/tests/setup-helpers';

let search = '';
vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams(search),
}));

beforeEach(() => {
    search = '';
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

    it('keeps the search and filter it was opened with', () => {
        search = 'q=push&status=active&page=1';
        renderWithLocale(
            <Pagination
                page={1}
                totalPages={2}
            />
        );
        expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute(
            'href',
            '?q=push&status=active&page=2'
        );
    });
});
