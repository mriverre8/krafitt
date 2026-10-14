import { WorkoutCard } from '@/components/routine/workout-card';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const props = {
    id: 'w1',
    name: 'Legs',
    exercises: 5,
    times: 3,
    status: 'pending' as const,
};

describe('WorkoutCard', () => {
    it('says what it is made of and how often it was done', () => {
        render(<WorkoutCard {...props} />);
        expect(screen.getByRole('link')).toHaveAttribute(
            'href',
            '/workouts/w1'
        );
        expect(screen.getByText('Legs')).toBeInTheDocument();
        expect(
            screen.getByText('5 exercises · 3 sessions')
        ).toBeInTheDocument();
    });

    // It never runs out, so there is no progress to draw.
    it('has no progress ladder', () => {
        render(<WorkoutCard {...props} />);
        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('wears a workout’s own words for its status', () => {
        const { rerender } = render(<WorkoutCard {...props} />);
        expect(screen.getByText('Ready')).toBeInTheDocument();

        rerender(
            <WorkoutCard
                {...props}
                status="active"
            />
        );
        expect(screen.getByText('In progress')).toBeInTheDocument();

        rerender(
            <WorkoutCard
                {...props}
                status="incomplete"
            />
        );
        expect(screen.getByText('Incomplete')).toBeInTheDocument();
    });
});
