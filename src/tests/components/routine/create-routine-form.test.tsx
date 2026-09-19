import { CreateRoutineForm } from '@/components/routine/create-routine-form';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { noopAction, renderWithLocale } from '@/tests/setup-helpers';

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

    // A number box takes no maxLength, so the weeks it will not hold are cut
    // off as they are typed.
    it('keeps the weeks box to two digits', () => {
        render(<CreateRoutineForm action={noopAction} />);
        const weeks = screen.getByLabelText('Duration in weeks');

        fireEvent.change(weeks, { target: { value: '123' } });
        expect(weeks).toHaveValue(12);
    });

    // The two halves of the duration choice: one disables the weeks box, the
    // other hands it back.
    it('takes an open-ended routine with no weeks typed in', () => {
        render(<CreateRoutineForm action={noopAction} />);
        const create = screen.getByRole('button', { name: 'Create routine' });
        const weeks = screen.getByLabelText('Duration in weeks');

        fireEvent.input(screen.getByLabelText('Name'), {
            target: { value: 'Push Pull Legs' },
        });
        expect(create).toBeDisabled();

        fireEvent.click(screen.getByRole('button', { name: 'Open-ended' }));
        expect(weeks).toBeDisabled();
        expect(create).toBeEnabled();

        fireEvent.click(screen.getByRole('button', { name: 'Weeks' }));
        expect(weeks).toBeEnabled();
        expect(create).toBeDisabled();
    });

    it('says which of the two sides is the one picked', () => {
        render(<CreateRoutineForm action={noopAction} />);
        const open = screen.getByRole('button', { name: 'Open-ended' });
        const fixed = screen.getByRole('button', { name: 'Weeks' });

        expect(fixed).toHaveAttribute('aria-pressed', 'true');
        expect(open).toHaveAttribute('aria-pressed', 'false');

        fireEvent.click(open);
        expect(open).toHaveAttribute('aria-pressed', 'true');
        expect(fixed).toHaveAttribute('aria-pressed', 'false');
    });

    it('translates its copy', () => {
        renderWithLocale(<CreateRoutineForm action={noopAction} />, 'ca');
        expect(
            screen.getByRole('button', { name: 'Crear rutina' })
        ).toBeInTheDocument();
    });
});
