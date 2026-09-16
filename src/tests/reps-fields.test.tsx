import { RepsFields } from '@/components/workout/reps-fields';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const min = 'Exercise 1, min reps set 1';
const max = 'Exercise 1, max reps set 1';

const reps = (props: Partial<Parameters<typeof RepsFields>[0]> = {}) =>
    render(
        <RepsFields
            e={1}
            n="1"
            mode="range"
            repMin="4"
            repMax="6"
            wrong={{ min: false, max: false }}
            onChange={() => {}}
            {...props}
        />
    );

describe('RepsFields', () => {
    it('opens on what the set holds', () => {
        reps();
        expect(screen.getByLabelText(min)).toHaveValue(4);
        expect(screen.getByLabelText(max)).toHaveValue(6);
    });

    // The mode decides the shape of the slot, and the slot is the same width
    // whichever shape it takes, so the columns line up down the card.
    it('shows only the boxes the mode needs', () => {
        reps({ mode: 'fixed' });
        expect(screen.getByLabelText(min)).toBeInTheDocument();
        expect(screen.queryByLabelText(max)).not.toBeInTheDocument();
        expect(screen.queryByText('to')).not.toBeInTheDocument();

        cleanup();
        reps();
        expect(screen.getByLabelText(max)).toBeInTheDocument();
        // The two boxes of a range read as one prescription, not two numbers.
        expect(screen.getByText('to')).toBeInTheDocument();
    });

    // A mode that prescribes no number says so in the slot the numbers would
    // have had, rather than leaving a dash to be read as a field somebody
    // forgot to fill.
    it('swaps both boxes for a readout when the mode prescribes no number', () => {
        reps({ mode: 'amrap' });
        expect(screen.queryByLabelText(min)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(max)).not.toBeInTheDocument();
        expect(screen.getByText('To failure')).toBeInTheDocument();

        cleanup();
        reps({ mode: 'unspecified' });
        expect(screen.getByText('Unspecified reps')).toBeInTheDocument();
    });

    it('patches one box at a time', () => {
        const onChange = vi.fn();
        reps({ onChange });
        fireEvent.change(screen.getByLabelText(min), {
            target: { value: '5' },
        });
        expect(onChange).toHaveBeenCalledWith({ repMin: '5' });

        fireEvent.change(screen.getByLabelText(max), {
            target: { value: '8' },
        });
        expect(onChange).toHaveBeenLastCalledWith({ repMax: '8' });
    });

    // `maxLength` does nothing on a number input, so the cap has to hold here.
    it('cuts a typed number down to the digits reps are allowed', () => {
        const onChange = vi.fn();
        reps({ onChange });
        fireEvent.change(screen.getByLabelText(min), {
            target: { value: '1234' },
        });
        expect(onChange).toHaveBeenCalledWith({ repMin: '123' });
    });

    // jsdom has no Tailwind, so the utility class is what we can assert on.
    it('paints exactly the box the fault names', () => {
        reps({ wrong: { min: false, max: true } });
        expect(screen.getByLabelText(min)).not.toHaveClass('border-danger');
        expect(screen.getByLabelText(max)).toHaveClass('border-danger');
    });

    it('names its boxes after the exercise and the set', () => {
        reps({ e: 2, n: 'DS1' });
        expect(
            screen.getByLabelText('Exercise 2, min reps set DS1')
        ).toBeInTheDocument();
    });
});
