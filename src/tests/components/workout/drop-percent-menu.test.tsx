import { DropPercentMenu } from '@/components/workout/drop-percent-menu';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithLocale } from '@/tests/setup-helpers';

const trigger = () =>
    screen.getByRole('button', { name: 'Exercise 1, DS1 amount' });

/** The trigger and its panel are siblings, so the whole menu is what the
    trigger's parent holds — the trigger itself being the first button in it. */
const rows = () =>
    within(trigger().parentElement!)
        .getAllByRole('button')
        .map((button) => button.textContent)
        .slice(1);

const drop = (props: Partial<Parameters<typeof DropPercentMenu>[0]> = {}) =>
    render(
        <DropPercentMenu
            exerciseNumber={1}
            setLabel="DS1"
            value=""
            onChange={() => {}}
            {...props}
        />
    );

describe('DropPercentMenu', () => {
    // The unit on its own, on any screen: the row above it already says the
    // set is a drop, so the column only has to say how much.
    it('shows the unit alone until the drop has been sized', () => {
        drop();
        expect(trigger()).toHaveTextContent('%');
        expect(rows()).toHaveLength(0);
    });

    it('says what it holds once it has one', () => {
        drop({ value: '30' });
        expect(trigger()).toHaveTextContent('30%');
    });

    // Five round numbers cover what anyone actually programmes; the odd ones
    // are not worth a keyboard.
    it('offers the per cents a drop is worth picking', () => {
        drop();
        fireEvent.click(trigger());
        expect(rows()).toEqual(['10%', '20%', '30%', '40%', '50%']);
    });

    it('reports the picked per cent as a number to type, and closes', () => {
        const onChange = vi.fn();
        drop({ onChange });
        fireEvent.click(trigger());
        fireEvent.click(screen.getByRole('button', { name: '30%' }));
        expect(onChange).toHaveBeenCalledWith('30');
        expect(rows()).toHaveLength(0);
    });

    // A drop with no per cent trains fine, so the row that says so is only
    // worth offering once one has been picked.
    it('offers the way back to unspecified once it holds something', () => {
        const { unmount } = drop();
        fireEvent.click(trigger());
        expect(rows()).not.toContain('Unspecified');
        unmount();

        const onChange = vi.fn();
        drop({ value: '30', onChange });
        fireEvent.click(trigger());
        expect(rows()).toContain('Unspecified');
        fireEvent.click(screen.getByRole('button', { name: 'Unspecified' }));
        expect(onChange).toHaveBeenCalledWith('');
    });

    // Swapping one is picking again from the same list, rather than clearing
    // it first.
    it('opens the same list again when it already holds one', () => {
        const onChange = vi.fn();
        drop({ value: '30', onChange });
        fireEvent.click(trigger());
        fireEvent.click(screen.getByRole('button', { name: '50%' }));
        expect(onChange).toHaveBeenCalledWith('50');
    });

    it('names itself after the exercise and the row', () => {
        drop({ exerciseNumber: 2, setLabel: 'DS2' });
        expect(
            screen.getByRole('button', { name: 'Exercise 2, DS2 amount' })
        ).toBeInTheDocument();
    });

    it('translates its label', () => {
        renderWithLocale(
            <DropPercentMenu
                exerciseNumber={1}
                setLabel="DS1"
                value=""
                onChange={() => {}}
            />,
            'es'
        );
        expect(
            screen.getByRole('button', { name: 'Ejercicio 1, cantidad de DS1' })
        ).toBeInTheDocument();
    });
});
