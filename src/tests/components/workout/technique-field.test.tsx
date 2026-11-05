import { TechniqueField } from '@/components/workout/technique-field';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const trigger = () =>
    screen.getByRole('button', { name: 'Exercise 1, set 1 technique' });

/** The trigger and its panel are siblings, so the whole menu is what the
    trigger's parent holds — the trigger itself being the first button in it. */
const rows = () =>
    within(trigger().parentElement!)
        .getAllByRole('button')
        .map((button) => button.textContent)
        .slice(1);

const technique = (props: Partial<Parameters<typeof TechniqueField>[0]> = {}) =>
    render(
        <TechniqueField
            exerciseNumber={1}
            setLabel="1"
            technique={null}
            wrong={false}
            onChange={() => {}}
            onWrite={() => {}}
            {...props}
        />
    );

describe('TechniqueField', () => {
    // It sits beside the set's name: empty, it offers to add one, and nothing
    // is open until it is pressed.
    it('offers to add one, and lists the choices once pressed', () => {
        technique();
        expect(trigger()).toHaveTextContent('Add technique');
        expect(rows()).toHaveLength(0);

        // Nothing to take off yet, so the list stops at Custom.
        fireEvent.click(trigger());
        expect(rows()).toEqual([
            'Warm-up set',
            'Straight sets',
            'Top set',
            'Back off',
            'Custom',
        ]);
    });

    it('names the one the set has, listed or written', () => {
        const { unmount } = technique({ technique: 'Top set' });
        expect(trigger()).toHaveTextContent('Top set');
        unmount();

        technique({ technique: 'Cluster' });
        expect(trigger()).toHaveTextContent('Cluster');
    });

    it('takes a listed one, marking the one it already holds', () => {
        const onChange = vi.fn();
        technique({ technique: 'Top set', onChange });
        fireEvent.click(trigger());
        expect(screen.getByRole('button', { name: 'Top set' })).toHaveAttribute(
            'aria-pressed',
            'true'
        );
        fireEvent.click(screen.getByRole('button', { name: 'Back off' }));
        expect(onChange).toHaveBeenCalledWith('Back off');
        expect(rows()).toHaveLength(0);
    });

    // Custom hands the set nothing yet: it asks for a name to be written,
    // from the one the set already has if that one was written too.
    it('asks for a name on Custom instead of handing the set a blank', () => {
        const onChange = vi.fn();
        const onWrite = vi.fn();
        const { unmount } = technique({ onChange, onWrite });
        fireEvent.click(trigger());
        fireEvent.click(screen.getByRole('button', { name: 'Custom' }));
        expect(onWrite).toHaveBeenCalledWith('');
        expect(onChange).not.toHaveBeenCalled();
        unmount();

        // Holding a written one, the Custom row is that one, marked as picked,
        // and pressing it edits it.
        technique({ technique: 'Cluster', onWrite });
        fireEvent.click(trigger());
        expect(rows()).not.toContain('Custom');
        const mine = screen.getByRole('button', { name: 'Cluster' });
        expect(mine).toHaveAttribute('aria-pressed', 'true');
        fireEvent.click(mine);
        expect(onWrite).toHaveBeenLastCalledWith('Cluster');
    });

    // While its name is being written, Custom is what the set is getting,
    // whatever it held before.
    it('says Custom while one is being written, and shows it picked', () => {
        const onWrite = vi.fn();
        technique({ technique: 'Top set', writing: true, onWrite });
        expect(trigger()).toHaveTextContent('Custom');
        fireEvent.click(trigger());
        expect(screen.getByRole('button', { name: 'Top set' })).toHaveAttribute(
            'aria-pressed',
            'false'
        );
        const custom = screen.getByRole('button', { name: 'Custom' });
        expect(custom).toHaveAttribute('aria-pressed', 'true');

        // Pressing it again leaves the box as it is.
        fireEvent.click(custom);
        expect(onWrite).not.toHaveBeenCalled();
        expect(rows()).toHaveLength(0);
    });

    it('offers the way back to nothing only once it holds something', () => {
        const onChange = vi.fn();
        technique({ technique: 'Top set', onChange });
        fireEvent.click(trigger());
        expect(rows()).toContain('Remove technique');
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Exercise 1, remove technique set 1',
            })
        );
        expect(onChange).toHaveBeenCalledWith(null);
    });

    // A blank one can still come from a save made before Custom asked for a
    // name. jsdom has no Tailwind, so the utility class is what we can check.
    it('is marked when the routine reports it', () => {
        technique({ technique: '', wrong: true });
        expect(trigger()).toHaveTextContent('Custom');
        expect(trigger()).toHaveClass('text-danger');
    });

    it('names itself after the exercise and the set', () => {
        technique({ exerciseNumber: 2, setLabel: '3' });
        expect(
            screen.getByRole('button', { name: 'Exercise 2, set 3 technique' })
        ).toBeInTheDocument();
    });
});
