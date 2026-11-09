import { ExerciseNameField } from '@/components/workout/exercise-name-field';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

/** The field as a card holds it: its own name, kept by the card. */
function Field({
    suggestions,
    initial = '',
}: {
    suggestions: string[];
    initial?: string;
}) {
    const [name, setName] = useState(initial);
    return (
        <div className="relative">
            <ExerciseNameField
                value={name}
                onChange={setName}
                suggestions={suggestions}
                aria-label="Exercise 1 name"
            />
        </div>
    );
}

const field = () => screen.getByRole('combobox', { name: 'Exercise 1 name' });
const options = () =>
    screen.queryAllByRole('option').map((option) => option.textContent);

describe('ExerciseNameField', () => {
    it('opens the list when the field is focused', () => {
        render(<Field suggestions={['Dips', 'Row']} />);
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        fireEvent.focus(field());
        expect(field()).toHaveAttribute('aria-expanded', 'true');
        expect(options()).toEqual(['Dips', 'Row']);
    });

    it('narrows the list to the names holding what was typed', () => {
        render(<Field suggestions={['Bench press', 'Leg press', 'Row']} />);
        fireEvent.change(field(), { target: { value: 'PRESS' } });
        expect(options()).toEqual(['Bench press', 'Leg press']);
    });

    it('holds twenty at most', () => {
        render(
            <Field
                suggestions={Array.from({ length: 25 }, (_, i) => `Curl ${i}`)}
            />
        );
        fireEvent.focus(field());
        expect(options()).toHaveLength(20);
    });

    it('stays shut when nothing matches', () => {
        render(<Field suggestions={['Dips']} />);
        fireEvent.change(field(), { target: { value: 'Squat' } });
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(field()).toHaveAttribute('aria-expanded', 'false');
    });

    it('fills the name in with the one picked, and closes', () => {
        render(<Field suggestions={['Dips', 'Row']} />);
        fireEvent.focus(field());
        fireEvent.click(screen.getByRole('option', { name: 'Row' }));
        expect(field()).toHaveValue('Row');
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('is walked with the arrows and picked with Enter', () => {
        render(<Field suggestions={['Dips', 'Row']} />);
        fireEvent.focus(field());
        fireEvent.keyDown(field(), { key: 'ArrowDown' });
        fireEvent.keyDown(field(), { key: 'ArrowDown' });
        expect(screen.getByRole('option', { name: 'Row' })).toHaveAttribute(
            'aria-selected',
            'true'
        );
        fireEvent.keyDown(field(), { key: 'Enter' });
        expect(field()).toHaveValue('Row');
    });

    // A search box clears itself on Escape; a name typed in must not go.
    it('closes on Escape without wiping the name', () => {
        render(
            <Field
                suggestions={['Dips']}
                initial="D"
            />
        );
        fireEvent.focus(field());
        fireEvent.keyDown(field(), { key: 'Escape' });
        expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
        expect(field()).toHaveValue('D');
    });
});
