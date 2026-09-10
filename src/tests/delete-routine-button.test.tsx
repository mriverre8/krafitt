import { DeleteRoutineButton } from '@/components/delete-routine-button';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const button = () => screen.getByRole('button', { name: /Delete routine/ });

describe('DeleteRoutineButton', () => {
    it('deletes the routine once the confirmation is accepted', async () => {
        const onDelete = vi.fn().mockResolvedValue(undefined);
        vi.spyOn(window, 'confirm').mockReturnValue(true);
        render(
            <DeleteRoutineButton
                name="Strength"
                onDelete={onDelete}
            />
        );

        fireEvent.click(button());
        await waitFor(() => expect(onDelete).toHaveBeenCalledOnce());
    });

    // Nothing about a deleted routine comes back, so a mis-click must cost
    // nothing.
    it('keeps the routine when the confirmation is declined', () => {
        const onDelete = vi.fn();
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        render(
            <DeleteRoutineButton
                name="Strength"
                onDelete={onDelete}
            />
        );

        fireEvent.click(button());
        expect(onDelete).not.toHaveBeenCalled();
    });

    it('names the routine in the confirmation', () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false);
        render(
            <DeleteRoutineButton
                name="Strength"
                onDelete={vi.fn()}
            />
        );

        fireEvent.click(button());
        expect(window.confirm).toHaveBeenCalledWith(
            'Delete the routine Strength? All progress is lost.'
        );
    });
});
