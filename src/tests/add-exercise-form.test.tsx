import { AddExerciseForm } from '@/components/add-exercise-form';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { noopAction } from './setup-helpers';

const form = () => (
    <AddExerciseForm
        action={noopAction}
        workoutId="w1"
    />
);

describe('AddExerciseForm', () => {
    it('starts with a single set and its own rep range and technique', () => {
        render(form());
        expect(screen.getByLabelText('Exercise name')).toBeInTheDocument();
        expect(screen.getByLabelText('Min reps set 1')).toBeInTheDocument();
        expect(screen.getByLabelText('Max reps set 1')).toBeInTheDocument();
        expect(screen.getByLabelText('Technique set 1')).toBeInTheDocument();
        expect(
            screen.queryByLabelText('Min reps set 2')
        ).not.toBeInTheDocument();
    });

    it('adds and removes sets one at a time', () => {
        render(form());
        fireEvent.click(screen.getByRole('button', { name: 'Add set' }));
        expect(screen.getByLabelText('Technique set 2')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Remove set 1' }));
        expect(
            screen.queryByLabelText('Technique set 2')
        ).not.toBeInTheDocument();
        // The exercise always keeps at least one set.
        expect(
            screen.getByRole('button', { name: 'Remove set 1' })
        ).toBeDisabled();
    });

    it('keeps each set independent', () => {
        render(form());
        fireEvent.click(screen.getByRole('button', { name: 'Add set' }));
        fireEvent.change(screen.getByLabelText('Min reps set 1'), {
            target: { value: '4' },
        });
        fireEvent.change(screen.getByLabelText('Technique set 2'), {
            target: { value: 'Back off' },
        });
        expect(screen.getByLabelText('Min reps set 1')).toHaveValue(4);
        expect(screen.getByLabelText('Min reps set 2')).toHaveValue(null);
        expect(screen.getByLabelText('Technique set 1')).toHaveValue('');
        expect(screen.getByLabelText('Technique set 2')).toHaveValue(
            'Back off'
        );
    });

    // jsdom has no Tailwind, so the utility class is what we can assert on.
    it('shows only the inputs the rep type needs', () => {
        render(form());
        const mode = screen.getByLabelText('Reps type set 1');
        const min = screen.getByLabelText('Min reps set 1');
        const max = screen.getByLabelText('Max reps set 1');
        expect(min).not.toHaveClass('hidden');
        expect(max).not.toHaveClass('hidden');

        fireEvent.change(mode, { target: { value: 'fixed' } });
        expect(min).not.toHaveClass('hidden');
        expect(max).toHaveClass('hidden');

        fireEvent.change(mode, { target: { value: 'amrap' } });
        expect(min).toHaveClass('hidden');
        expect(max).toHaveClass('hidden');
    });

    it('keeps every value when the action rejects the submission', async () => {
        render(
            <AddExerciseForm
                action={async () => ({ error: 'Nope' })}
                workoutId="w1"
            />
        );
        fireEvent.change(screen.getByLabelText('Exercise name'), {
            target: { value: 'Bench press' },
        });
        fireEvent.change(screen.getByLabelText('Min reps set 1'), {
            target: { value: '6' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Add exercise' }));

        await screen.findByText('Nope');
        expect(screen.getByLabelText('Exercise name')).toHaveValue(
            'Bench press'
        );
        expect(screen.getByLabelText('Min reps set 1')).toHaveValue(6);
    });

    it('clears itself once the exercise is created', async () => {
        render(
            <AddExerciseForm
                action={async () => ({ ok: true as const })}
                workoutId="w1"
            />
        );
        fireEvent.change(screen.getByLabelText('Exercise name'), {
            target: { value: 'Bench press' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Add set' }));
        fireEvent.click(screen.getByRole('button', { name: 'Add exercise' }));

        await waitFor(() =>
            expect(screen.getByLabelText('Exercise name')).toHaveValue('')
        );
        expect(
            screen.queryByLabelText('Min reps set 2')
        ).not.toBeInTheDocument();
    });

    it('suggests the known techniques', () => {
        const { container } = render(form());
        const options = [...container.querySelectorAll('datalist option')].map(
            (o) => o.getAttribute('value')
        );
        expect(options).toEqual([
            'Straight sets',
            'Top set',
            'Back off',
            'Drop set',
        ]);
    });

    it('carries the workout id with the submission', () => {
        const { container } = render(form());
        expect(container.querySelector('input[name="workoutId"]')).toHaveValue(
            'w1'
        );
    });
});
