import { RepModeSelect } from '@/components/workout/rep-mode-select';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithLocale } from './setup-helpers';

const label = 'Exercise 1, reps type set 1';

const select = (props: Partial<Parameters<typeof RepModeSelect>[0]> = {}) =>
    render(
        <RepModeSelect
            e={1}
            n="1"
            mode="range"
            onChange={() => {}}
            {...props}
        />
    );

describe('RepModeSelect', () => {
    it('opens on the mode the set holds', () => {
        select({ mode: 'amrap' });
        expect(screen.getByLabelText(label)).toHaveValue('amrap');
    });

    // All four, always: the mode is what decides what the rest of the row asks
    // for, so none of them is ever hidden behind the others.
    it('offers every way a set can prescribe its reps', () => {
        select();
        expect(
            screen
                .getAllByRole('option')
                .map((option) => (option as HTMLOptionElement).value)
        ).toEqual(['range', 'fixed', 'amrap', 'unspecified']);
        expect(
            screen.getByRole('option', { name: 'Range' })
        ).toBeInTheDocument();
    });

    it('reports the picked mode', () => {
        const onChange = vi.fn();
        select({ onChange });
        fireEvent.change(screen.getByLabelText(label), {
            target: { value: 'fixed' },
        });
        expect(onChange).toHaveBeenCalledWith('fixed');
    });

    // A day holds several cards and a card several sets, so the label has to
    // carry both numbers or it names more than one control.
    it('names itself after the exercise and the set', () => {
        select({ e: 3, n: 'DS1' });
        expect(
            screen.getByLabelText('Exercise 3, reps type set DS1')
        ).toBeInTheDocument();
    });

    it('translates its label and its options', () => {
        renderWithLocale(
            <RepModeSelect
                e={1}
                n="1"
                mode="range"
                onChange={() => {}}
            />,
            'es'
        );
        expect(
            screen.getByLabelText('Ejercicio 1, tipo de reps serie 1')
        ).toBeInTheDocument();
        expect(
            screen.getByRole('option', { name: 'Rango' })
        ).toBeInTheDocument();
    });
});
