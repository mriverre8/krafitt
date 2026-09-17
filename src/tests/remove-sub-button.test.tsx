import { RemoveSubButton } from '@/components/workout/remove-sub-button';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithLocale } from './setup-helpers';

describe('RemoveSubButton', () => {
    // One option is not a menu: the row wears its one action, so taking a drop
    // set out is one tap rather than open-then-pick.
    it('names itself after the exercise and the row it drops', () => {
        render(
            <RemoveSubButton
                exerciseNumber={2}
                setLabel="DS1"
                onRemove={() => {}}
            />
        );
        expect(
            screen.getByRole('button', { name: 'Exercise 2, remove set DS1' })
        ).toBeInTheDocument();
    });

    it('reports the removal', () => {
        const onRemove = vi.fn();
        render(
            <RemoveSubButton
                exerciseNumber={1}
                setLabel="RP1"
                onRemove={onRemove}
            />
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Exercise 1, remove set RP1' })
        );
        expect(onRemove).toHaveBeenCalledOnce();
    });

    it('translates its label', () => {
        renderWithLocale(
            <RemoveSubButton
                exerciseNumber={1}
                setLabel="DS1"
                onRemove={() => {}}
            />,
            'es'
        );
        expect(
            screen.getByRole('button', {
                name: 'Ejercicio 1, quitar serie DS1',
            })
        ).toBeInTheDocument();
    });
});
