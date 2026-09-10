import {
    RoutineSummary,
    type RoutineSummaryProps,
} from '@/components/routine/routine-summary';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const base: RoutineSummaryProps = {
    id: 'r1',
    name: 'Strength',
    durationWeeks: 4,
    workoutCount: 3,
    cursor: 6,
    state: 'active',
};

describe('RoutineSummary', () => {
    it('summarises the routine and how far it got', () => {
        render(<RoutineSummary {...base} />);
        expect(screen.getByText('Strength')).toBeInTheDocument();
        expect(screen.getByText('4 weeks · 3 days')).toBeInTheDocument();
        expect(screen.getByText('6/12 workouts')).toBeInTheDocument();
    });

    it('links into the routine', () => {
        render(<RoutineSummary {...base} />);
        expect(screen.getByRole('link')).toHaveAttribute(
            'href',
            '/routines/r1'
        );
    });

    it('badges the active one and the finished one differently', () => {
        const { unmount } = render(<RoutineSummary {...base} />);
        expect(screen.getByText('Active')).toBeInTheDocument();
        unmount();

        render(
            <RoutineSummary
                {...base}
                state="finished"
                cursor={12}
            />
        );
        expect(screen.getByText('Finished')).toBeInTheDocument();
        expect(screen.getByText('12/12 workouts')).toBeInTheDocument();
    });

    it('never reports more progress than the routine has', () => {
        render(
            <RoutineSummary
                {...base}
                cursor={99}
            />
        );
        expect(screen.getByText('12/12 workouts')).toBeInTheDocument();
    });
});
