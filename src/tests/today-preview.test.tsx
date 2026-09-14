import { TodayPreview } from '@/components/landing/today-preview';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithLocale } from './setup-helpers';

describe('TodayPreview', () => {
    // A photograph of the app mid-workout: two of the four sets banked, and the
    // counter and ladder saying exactly that.
    it('catches the session halfway through', () => {
        render(<TodayPreview />);

        expect(screen.getByText('2/4 sets')).toBeInTheDocument();
        expect(screen.getByLabelText('Weight set 1')).toHaveValue(80);
        expect(screen.getByLabelText('Reps set 1')).toHaveValue(7);
        expect(screen.getByLabelText('Weight set 2')).toHaveValue(72.5);
    });

    // The app's own component, so the sets keep their real states — the third
    // is open and lit rather than greyed out — and the whole block is inert
    // instead. A still, not a toy: nothing invites a tap it cannot answer.
    it('keeps the real states and locks the block', () => {
        render(<TodayPreview />);

        expect(screen.getByLabelText('Weight set 3')).toBeEnabled();
        expect(
            screen.getByLabelText('Weight set 1').closest('[inert]')
        ).not.toBeNull();
    });

    it('names the week it is standing in', () => {
        render(<TodayPreview />);
        expect(screen.getByText('Week 4 of 8')).toBeInTheDocument();
    });

    // Everything on it comes out of the app's own dictionary, demo data
    // included, so the still is never in one language and the page in another.
    it('translates with the rest of the page', () => {
        renderWithLocale(<TodayPreview />, 'es');
        expect(screen.getByText('2/4 series')).toBeInTheDocument();
    });
});
