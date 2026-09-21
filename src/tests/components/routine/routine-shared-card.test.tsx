import {
    RoutineSharedCard,
    type RoutineSharedCardProps,
} from '@/components/routine/routine-shared-card';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const props: RoutineSharedCardProps = {
    id: 'r1',
    name: 'Strength',
    durationWeeks: 4,
    workoutCount: 3,
    cursor: 6,
    ownerName: 'Ada',
    ownerImage: null,
    role: 'coach',
};

describe('RoutineSharedCard', () => {
    it('summarises the routine and says whose it is', () => {
        render(<RoutineSharedCard {...props} />);

        expect(screen.getByText('Strength')).toBeInTheDocument();
        expect(screen.getByText('4 weeks · 3 days')).toBeInTheDocument();
        expect(screen.getByText('Routine by Ada')).toBeInTheDocument();
        expect(screen.getByText('6/12 workouts')).toBeInTheDocument();
    });

    it('makes the whole card one link into the routine', () => {
        render(<RoutineSharedCard {...props} />);

        expect(screen.getByRole('link')).toHaveAttribute(
            'href',
            '/routines/r1'
        );
    });

    it('says what you are on it', () => {
        render(<RoutineSharedCard {...props} />);
        expect(screen.getByText('Coach')).toBeInTheDocument();

        render(
            <RoutineSharedCard
                {...props}
                role="scout"
            />
        );
        expect(screen.getByText('Scout')).toBeInTheDocument();
    });

    // Active, pending, incomplete and finished all answer "what could you do
    // with this next", and none of those moves belongs to a guest.
    it('carries no state badge, whatever the routine is doing', () => {
        render(<RoutineSharedCard {...props} />);

        for (const state of ['Active', 'Pending', 'Incomplete', 'Finished']) {
            expect(screen.queryByText(state)).not.toBeInTheDocument();
        }
    });

    // An open-ended routine has no last week, so there is no bar to fill —
    // the count still says how much has been done.
    it('drops the ladder for an open-ended routine', () => {
        render(
            <RoutineSharedCard
                {...props}
                durationWeeks={null}
            />
        );

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
        expect(screen.getByText('6 workouts')).toBeInTheDocument();
    });
});
