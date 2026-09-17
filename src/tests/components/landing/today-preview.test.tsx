import { TodayPreview } from '@/components/landing/today-preview';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithLocale } from '@/tests/setup-helpers';

describe('TodayPreview', () => {
    // A still of the app mid-session: half the sets banked, and nothing on it
    // that invites a tap it cannot answer.
    it('shows the training screen half finished and locked', () => {
        render(<TodayPreview />);

        expect(screen.getByText('2/4 sets')).toBeInTheDocument();
        expect(screen.getByLabelText('Weight set 1')).toHaveValue(80);
        expect(screen.getByLabelText('Reps set 2')).toHaveValue(9);

        // The sets keep the app's real states — so the third is open and lit
        // rather than greyed — and the whole block is inert instead.
        expect(screen.getByLabelText('Weight set 3')).toBeEnabled();
        expect(
            screen.getByLabelText('Weight set 1').closest('[inert]')
        ).not.toBeNull();
    });

    it('names the routine, the day and the week', () => {
        render(<TodayPreview />);

        expect(screen.getByText('Upper / Lower')).toBeInTheDocument();
        expect(screen.getByText('Bench press')).toBeInTheDocument();
        expect(screen.getByText('Week 4 of 8')).toBeInTheDocument();
    });

    it('translates', () => {
        renderWithLocale(<TodayPreview />, 'es');
        expect(screen.getByText('Torso / Pierna')).toBeInTheDocument();
    });
});
