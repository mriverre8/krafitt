import { SetMenu } from '@/components/workout/set-menu';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const trigger = () =>
    screen.getByRole('button', { name: 'Exercise 1, set 1 actions' });

/** The trigger and its panel are siblings, so the whole menu is what the
    trigger's parent holds — the trigger itself being the first button in it. */
const rows = () =>
    within(trigger().parentElement!).getAllByRole('button').slice(1);

const menu = (props: Partial<Parameters<typeof SetMenu>[0]> = {}) =>
    render(
        <SetMenu
            e={1}
            n="1"
            kind={null}
            full={false}
            canRemove
            onAdd={() => {}}
            onRemove={() => {}}
            {...props}
        />
    );

const open = () => fireEvent.click(trigger());

describe('SetMenu', () => {
    // Everything a row can be told to do sits behind one ⋯, so a day of nine
    // sets shows nine marks rather than forty controls.
    it('says nothing until it is opened', () => {
        menu();
        expect(rows()).toHaveLength(0);
        open();
        expect(rows().map((row) => row.textContent)).toEqual([
            'Add drop set',
            'Add rest-pause set',
            'Remove set',
        ]);
    });

    // One working set takes one kind, not both: once it has a drop, more drops
    // are all it can be given.
    it('offers only the kind the set already carries', () => {
        menu({ kind: 'drop' });
        open();
        expect(rows().map((row) => row.textContent)).toEqual([
            'Add drop set',
            'Remove set',
        ]);
    });

    it('reports the kind that was picked, and closes', () => {
        const onAdd = vi.fn();
        menu({ onAdd });
        open();
        fireEvent.click(
            screen.getByRole('button', { name: 'Add rest-pause set' })
        );
        expect(onAdd).toHaveBeenCalledWith('rest');
        expect(rows()).toHaveLength(0);
    });

    it('reports the removal, and closes', () => {
        const onRemove = vi.fn();
        menu({ onRemove });
        open();
        fireEvent.click(
            screen.getByRole('button', { name: 'Exercise 1, remove set 1' })
        );
        expect(onRemove).toHaveBeenCalledOnce();
        expect(rows()).toHaveLength(0);
    });

    it('shuts its adds once the exercise is at its cap', () => {
        menu({ full: true });
        open();
        expect(
            screen.getByRole('button', { name: 'Add drop set' })
        ).toBeDisabled();
        expect(
            screen.getByRole('button', { name: 'Exercise 1, remove set 1' })
        ).toBeEnabled();
    });

    // The exercise always shows at least one set, so the last one cannot go.
    it('shuts the removal when the set is all the exercise has', () => {
        menu({ canRemove: false });
        open();
        expect(
            screen.getByRole('button', { name: 'Exercise 1, remove set 1' })
        ).toBeDisabled();
    });

    it('names itself after the exercise and the set', () => {
        menu({ e: 3, n: '2' });
        expect(
            screen.getByRole('button', { name: 'Exercise 3, set 2 actions' })
        ).toBeInTheDocument();
    });
});
