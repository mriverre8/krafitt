import { CreateRoutineForm } from '@/components/routine/create-routine-form';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { noopAction, renderWithLocale } from './setup-helpers';

describe('CreateRoutineForm', () => {
    it('asks for a name and a duration', () => {
        render(<CreateRoutineForm action={noopAction} />);
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Duration in weeks')).toHaveValue(null);
        expect(
            screen.getByRole('button', { name: 'Create routine' })
        ).toBeInTheDocument();
    });

    it('keeps create disabled until both fields are filled in', () => {
        render(<CreateRoutineForm action={noopAction} />);
        const create = screen.getByRole('button', { name: 'Create routine' });
        expect(create).toBeDisabled();

        fireEvent.input(screen.getByLabelText('Name'), {
            target: { value: 'Push Pull Legs' },
        });
        expect(create).toBeDisabled();

        fireEvent.input(screen.getByLabelText('Duration in weeks'), {
            target: { value: '8' },
        });
        expect(create).toBeEnabled();
    });

    it('translates its copy', () => {
        renderWithLocale(<CreateRoutineForm action={noopAction} />, 'ca');
        expect(
            screen.getByRole('button', { name: 'Crear rutina' })
        ).toBeInTheDocument();
    });
});
