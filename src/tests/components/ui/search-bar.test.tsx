import { SearchBar } from '@/components/ui/search-bar';
import { fireEvent, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithLocale } from '@/tests/setup-helpers';

// A plain form in place of next/form: what is under test is whether the bar
// lets a submit through, not the router it would hand it to.
vi.mock('next/form', () => ({
    default: ({ role, onSubmit, children }: ComponentProps<'form'>) => (
        <form
            role={role}
            onSubmit={onSubmit}
        >
            {children}
        </form>
    ),
}));

const filter = {
    name: 'status',
    label: 'Status',
    value: 'active',
    options: [
        { value: '', label: 'All' },
        { value: 'active', label: 'Active' },
    ],
};

/** fireEvent answers false when the submit was cancelled. */
const submit = () => fireEvent.submit(screen.getByRole('search'));

describe('SearchBar', () => {
    it('does not search again for what the list already shows', () => {
        renderWithLocale(
            <SearchBar
                label="Search"
                placeholder="Name"
                defaultValue="push"
                filter={filter}
            />
        );
        fireEvent.change(screen.getByRole('searchbox'), {
            target: { value: ' push ' },
        });
        expect(submit()).toBe(false);
    });

    it('searches once the words or the filter change', () => {
        renderWithLocale(
            <SearchBar
                label="Search"
                placeholder="Name"
                defaultValue="push"
                filter={filter}
            />
        );
        fireEvent.change(screen.getByRole('searchbox'), {
            target: { value: 'pull' },
        });
        expect(submit()).toBe(true);

        fireEvent.change(screen.getByRole('searchbox'), {
            target: { value: 'push' },
        });
        fireEvent.click(screen.getByRole('radio', { name: 'All' }));
        expect(submit()).toBe(true);
    });
});
