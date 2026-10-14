import { CreateWorkoutForm } from '@/components/routine/create-workout-form';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { noopAction } from '@/tests/setup-helpers';

describe('CreateWorkoutForm', () => {
    // No duration: a workout is done as often as one likes.
    it('asks for a name and nothing else', () => {
        render(<CreateWorkoutForm action={noopAction} />);
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
        expect(
            screen.queryByLabelText('Duration in weeks')
        ).not.toBeInTheDocument();
    });

    it('keeps create disabled until it has a name', () => {
        render(<CreateWorkoutForm action={noopAction} />);
        const create = screen.getByRole('button', { name: 'Create workout' });
        expect(create).toBeDisabled();

        fireEvent.input(screen.getByLabelText('Name'), {
            target: { value: '   ' },
        });
        expect(create).toBeDisabled();

        fireEvent.input(screen.getByLabelText('Name'), {
            target: { value: 'Legs' },
        });
        expect(create).toBeEnabled();
    });
});
