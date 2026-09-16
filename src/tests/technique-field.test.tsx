import { TechniqueField } from '@/components/workout/technique-field';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const slot = () =>
    screen.getByRole('button', { name: 'Exercise 1, set 1 technique' });
const field = () => screen.getByLabelText('Exercise 1, technique set 1');

/** The trigger and its panel are siblings, so the whole menu is what the
    trigger's parent holds — the trigger itself being the first button in it. */
const rows = () =>
    within(slot().parentElement!)
        .getAllByRole('button')
        .map((button) => button.textContent)
        .slice(1);

const technique = (props: Partial<Parameters<typeof TechniqueField>[0]> = {}) =>
    render(
        <TechniqueField
            e={1}
            n="1"
            technique={null}
            wrong={false}
            onChange={() => {}}
            {...props}
        />
    );

describe('TechniqueField', () => {
    // The slot is on the row whether the set has a technique or not: an empty
    // slot you can see is what tells you the set can have one at all.
    it('holds a slot even when the set has none', () => {
        technique();
        expect(slot()).toHaveTextContent('Unspecified technique');
        expect(
            screen.queryByLabelText('Exercise 1, technique set 1')
        ).not.toBeInTheDocument();

        // Nothing to take off yet, so the list stops at Custom.
        fireEvent.click(slot());
        expect(rows()).toEqual([
            'Warm-up set',
            'Straight sets',
            'Top set',
            'Back off',
            'Custom',
        ]);
    });

    // One off the list is shown on the slot itself; anything else is a field to
    // write in, and Custom opens one by handing the set a blank.
    it('shows a listed one and gives a written one a field', () => {
        const { unmount } = technique({ technique: 'Top set' });
        expect(slot()).toHaveTextContent('Top set');
        unmount();

        technique({ technique: 'My own' });
        expect(field()).toHaveValue('My own');
        expect(
            screen.queryByRole('button', {
                name: 'Exercise 1, set 1 technique',
            })
        ).not.toBeInTheDocument();
    });

    it('takes what the menu was asked for, Custom taking nothing', () => {
        const onChange = vi.fn();
        technique({ onChange });

        fireEvent.click(slot());
        fireEvent.click(screen.getByRole('button', { name: 'Top set' }));
        expect(onChange).toHaveBeenCalledWith('Top set');

        fireEvent.click(slot());
        fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
        expect(onChange).toHaveBeenLastCalledWith('');
    });

    // Swapping one is picking again from the same list, and the way off the set
    // only appears once there is one to take off.
    it('offers the way back to nothing only once it holds something', () => {
        const { unmount } = technique();
        fireEvent.click(slot());
        expect(rows()).not.toContain('Unspecified');
        unmount();

        const onChange = vi.fn();
        technique({ technique: 'Top set', onChange });
        fireEvent.click(slot());
        expect(rows()).toContain('Unspecified');
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Exercise 1, remove technique set 1',
            })
        );
        expect(onChange).toHaveBeenCalledWith(null);
    });

    it('reports what is typed into a written one', () => {
        const onChange = vi.fn();
        technique({ technique: 'My own', onChange });
        fireEvent.change(field(), { target: { value: 'My other' } });
        expect(onChange).toHaveBeenCalledWith('My other');
    });

    it('hands a written one back to the empty slot from its own mark', () => {
        const onChange = vi.fn();
        technique({ technique: 'My own', onChange });
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Exercise 1, remove technique set 1',
            })
        );
        expect(onChange).toHaveBeenCalledWith(null);
    });

    // Saving a blank one is allowed; it is the routine that reports it. jsdom
    // has no Tailwind, so the utility class is what we can assert on.
    it('is marked once it has been added and left blank', () => {
        technique({ technique: '', wrong: true });
        expect(field()).toHaveClass('border-danger');
    });

    it('names itself after the exercise and the set', () => {
        technique({ e: 2, n: '3' });
        expect(
            screen.getByRole('button', { name: 'Exercise 2, set 3 technique' })
        ).toBeInTheDocument();
    });
});
