import { ProgressDemo } from '@/components/landing/progress-demo';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('ProgressDemo', () => {
    it('opens on the first exercise of the demo day', () => {
        render(<ProgressDemo />);
        expect(
            screen.getByRole('heading', { name: 'Bench press' })
        ).toBeInTheDocument();
        expect(screen.getByText('1/2')).toBeInTheDocument();
    });

    // Paging between exercises is the thing worth feeling, so unlike the
    // training screen above it this one really takes input.
    it('walks to the next exercise and back', () => {
        render(<ProgressDemo />);

        fireEvent.click(screen.getByRole('button', { name: 'Next exercise' }));
        expect(
            screen.getByRole('heading', { name: 'Back squat' })
        ).toBeInTheDocument();

        fireEvent.click(
            screen.getByRole('button', { name: 'Previous exercise' })
        );
        expect(
            screen.getByRole('heading', { name: 'Bench press' })
        ).toBeInTheDocument();
    });

    it('stops at both ends', () => {
        render(<ProgressDemo />);
        expect(
            screen.getByRole('button', { name: 'Previous exercise' })
        ).toBeDisabled();

        fireEvent.click(screen.getByRole('button', { name: 'Next exercise' }));
        expect(
            screen.getByRole('button', { name: 'Next exercise' })
        ).toBeDisabled();
    });

    // Week 4 was never trained and week 6 is where the block has got to, so
    // the blanks before the cursor read as missed and the ones after as ahead.
    it('tells a skipped week apart from one still to come', () => {
        render(<ProgressDemo />);
        expect(screen.getAllByText('Not logged').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Not trained yet').length).toBeGreaterThan(
            0
        );
    });
});
