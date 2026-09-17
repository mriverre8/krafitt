import { ProgressPreview } from '@/components/landing/progress-preview';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithLocale } from '@/tests/setup-helpers';

describe('ProgressPreview', () => {
    it('opens on the first exercise, with its logged weeks', () => {
        render(<ProgressPreview />);

        expect(
            screen.getByRole('heading', { name: 'Bench press' })
        ).toBeInTheDocument();
        expect(screen.getByText('80×6')).toBeInTheDocument();
    });

    // Week 4 was never trained and week 6 is the one we are on, so the blanks
    // above and below it have to read differently.
    it('tells a missed week from one still ahead', () => {
        render(<ProgressPreview />);

        expect(screen.getAllByText('Not logged')).toHaveLength(4);
        expect(screen.getAllByText('Not trained yet')).toHaveLength(8);
    });

    it('pages to the second exercise and back', () => {
        render(<ProgressPreview />);

        const next = screen.getByRole('button', { name: 'Next exercise' });
        const prev = screen.getByRole('button', { name: 'Previous exercise' });
        expect(prev).toBeDisabled();

        fireEvent.click(next);
        expect(
            screen.getByRole('heading', { name: 'Back squat' })
        ).toBeInTheDocument();
        expect(next).toBeDisabled();

        fireEvent.click(prev);
        expect(
            screen.getByRole('heading', { name: 'Bench press' })
        ).toBeInTheDocument();
    });

    it('translates', () => {
        renderWithLocale(<ProgressPreview />, 'es');
        expect(
            screen.getByRole('heading', { name: 'Press banca' })
        ).toBeInTheDocument();
        expect(screen.getAllByText('Sin registrar')).toHaveLength(4);
    });
});
