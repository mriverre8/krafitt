import { RowHead } from '@/components/workout/row-head';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('RowHead', () => {
    it('names the row and carries its one control', () => {
        render(
            <RowHead label="Set 1">
                <button type="button">Menu</button>
            </RowHead>
        );
        expect(screen.getByText('Set 1')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Menu' })
        ).toBeInTheDocument();
    });

    // jsdom has no Tailwind, so the utility class is what we can assert on: a
    // sub row stays quieter than the working set it hangs off.
    it('marks a working set apart from a sub row', () => {
        const { unmount } = render(
            <RowHead label="Set 1">
                <span />
            </RowHead>
        );
        expect(screen.getByText('Set 1')).toHaveClass('text-pulse');
        unmount();

        render(
            <RowHead
                label="Drop set"
                sub
            >
                <span />
            </RowHead>
        );
        expect(screen.getByText('Drop set')).toHaveClass('text-muted');
    });

    // The control sits at the end of the line whatever the label's length, so
    // every row's mark lands in the same column down the card.
    it('pushes the control to the end of the line', () => {
        render(
            <RowHead label="Set 1">
                <button type="button">Menu</button>
            </RowHead>
        );
        expect(
            screen.getByRole('button', { name: 'Menu' }).parentElement
        ).toHaveClass('ml-auto');
    });
});
