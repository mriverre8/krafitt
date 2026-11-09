import { ReorderDaysModal } from '@/components/modal/reorder-days-modal';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { withToasts } from '../../setup-helpers';

const days = [
    { id: 'w1', name: 'Push A' },
    { id: 'w2', name: 'Pull A' },
    { id: 'w3', name: 'Legs' },
];

const modal = (props: Partial<Parameters<typeof ReorderDaysModal>[0]> = {}) =>
    render(
        withToasts(
            <ReorderDaysModal
                days={days}
                onSave={async () => {}}
                onClose={() => {}}
                {...props}
            />
        )
    );

/** Each row as its number and its name, leaving out the note a moved one
    carries (see the test for that). */
const names = () =>
    screen
        .getAllByRole('listitem')
        .map(
            (row) =>
                `${row.querySelector('.figure')!.textContent}${row.querySelector('.display')!.textContent}`
        );
const button = (name: string) => screen.getByRole('button', { name });

describe('ReorderDaysModal', () => {
    it('lists the days in their order, numbered', () => {
        modal();
        expect(names()).toEqual(['1Push A', '2Pull A', '3Legs']);
        expect(button('Move Push A up')).toBeDisabled();
        expect(button('Move Legs down')).toBeDisabled();
    });

    // Nothing is stored until Save, so there is nothing to save until a day
    // has moved.
    it('keeps Save shut until a day has moved', () => {
        modal();
        expect(button('Save')).toBeDisabled();
        fireEvent.click(button('Move Push A down'));
        expect(names()).toEqual(['1Pull A', '2Push A', '3Legs']);
        expect(button('Save')).toBeEnabled();

        // Back where it was is nothing to save again.
        fireEvent.click(button('Move Push A up'));
        expect(button('Save')).toBeDisabled();
    });

    // Before anything is saved, a day that has left its place says where it
    // was, and its number takes the colour of an unsaved draft.
    it('marks a moved day with where it was', () => {
        modal();
        expect(screen.queryByText(/^Was day/)).not.toBeInTheDocument();
        fireEvent.click(button('Move Legs up'));
        expect(screen.getByText('Was day 3')).toBeInTheDocument();
        expect(screen.getByText('Was day 2')).toBeInTheDocument();
        const [first, second, third] = screen.getAllByRole('listitem');
        expect(first.querySelector('.figure')).not.toHaveClass('text-draft');
        expect(second.querySelector('.figure')).toHaveClass('text-draft');
        expect(third.querySelector('.figure')).toHaveClass('text-draft');

        // Back in its place, the mark goes.
        fireEvent.click(button('Move Legs down'));
        expect(screen.queryByText(/^Was day/)).not.toBeInTheDocument();
    });

    it('takes the focus along with the day, onto the arrow still live', () => {
        modal();
        fireEvent.click(button('Move Legs up'));
        expect(button('Move Legs up')).toHaveFocus();
        fireEvent.click(button('Move Legs up'));
        expect(names()[0]).toBe('1Legs');
        expect(button('Move Legs down')).toHaveFocus();
    });

    it('saves every day in the new order, then closes and says so', async () => {
        const onSave = vi.fn().mockResolvedValue(undefined);
        const onClose = vi.fn();
        modal({ onSave, onClose });
        fireEvent.click(button('Move Legs up'));
        fireEvent.click(button('Save'));

        await waitFor(() => expect(onClose).toHaveBeenCalled());
        expect(onSave).toHaveBeenCalledWith(['w1', 'w3', 'w2']);
        expect(await screen.findByText('Day order saved')).toBeInTheDocument();
    });

    it('stays open, the order kept, when the save is turned away', async () => {
        const onClose = vi.fn();
        modal({
            onSave: () => Promise.reject(new Error('gone')),
            onClose,
        });
        fireEvent.click(button('Move Legs up'));
        fireEvent.click(button('Save'));

        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();
        expect(names()).toEqual(['1Push A', '2Legs', '3Pull A']);
    });

    it('leaves the days as they were on Cancel', () => {
        const onSave = vi.fn();
        const onClose = vi.fn();
        modal({ onSave, onClose });
        fireEvent.click(button('Move Push A down'));
        fireEvent.click(button('Cancel'));
        expect(onClose).toHaveBeenCalled();
        expect(onSave).not.toHaveBeenCalled();
    });
});
