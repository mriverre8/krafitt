import {
    RoutineCard,
    type RoutineCardProps,
} from '@/components/routine/routine-card';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const props: RoutineCardProps = {
    id: 'r1',
    name: 'Strength',
    durationWeeks: 4,
    workoutCount: 3,
    cursor: 6,
    isActive: false,
    finished: false,
    canActivate: true,
};

describe('RoutineCard', () => {
    it('summarises the routine and its progress', () => {
        render(<RoutineCard {...props} />);
        expect(screen.getByText('Strength')).toBeInTheDocument();
        expect(screen.getByText('4 weeks · 3 days')).toBeInTheDocument();
        expect(screen.getByText('6/12 workouts')).toBeInTheDocument();
    });

    it('never reports more progress than the routine has', () => {
        render(
            <RoutineCard
                {...props}
                cursor={99}
            />
        );
        expect(screen.getByText('12/12 workouts')).toBeInTheDocument();
    });

    // The card only reports state now: activating happens on the routine's own
    // page, so nothing here is clickable but the name.
    it('marks a ready but inactive routine as pending, with nothing to press', () => {
        render(<RoutineCard {...props} />);
        expect(screen.getByText('Pending')).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('says so when the routine is not fully defined', () => {
        render(
            <RoutineCard
                {...props}
                canActivate={false}
            />
        );
        expect(screen.getByText('Incomplete')).toBeInTheDocument();
        expect(screen.queryByText('Pending')).not.toBeInTheDocument();
    });

    it('will not call a routine that is over pending', () => {
        render(
            <RoutineCard
                {...props}
                finished
            />
        );
        expect(screen.getByText('Finished')).toBeInTheDocument();
        expect(screen.queryByText('Pending')).not.toBeInTheDocument();
    });

    // The flag survives the last workout, but the card has to stop calling it
    // the one being trained: the home screen already says it is over.
    it('reads as finished even while it still holds the active flag', () => {
        render(
            <RoutineCard
                {...props}
                isActive
                finished
            />
        );
        expect(screen.getByText('Finished')).toBeInTheDocument();
        expect(screen.queryByText('Active')).not.toBeInTheDocument();
    });

    it('shows the active badge when the routine is the one being trained', () => {
        render(
            <RoutineCard
                {...props}
                isActive
            />
        );
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.queryByText('Pending')).not.toBeInTheDocument();
    });
});
