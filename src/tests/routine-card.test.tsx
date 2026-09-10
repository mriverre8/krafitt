import {
    RoutineCard,
    type RoutineCardProps,
} from '@/components/routine/routine-card';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const props: RoutineCardProps = {
    id: 'r1',
    name: 'Strength',
    durationWeeks: 4,
    workoutCount: 3,
    cursor: 6,
    isActive: false,
    finished: false,
    canActivate: true,
    onSetActive: async () => {},
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

    it('offers to activate a routine that is not active', async () => {
        const onSetActive = vi.fn().mockResolvedValue(undefined);
        render(
            <RoutineCard
                {...props}
                onSetActive={onSetActive}
            />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Set active' }));
        await waitFor(() => expect(onSetActive).toHaveBeenCalledWith('r1'));
    });

    it('withholds the button until the routine is fully defined', () => {
        render(
            <RoutineCard
                {...props}
                canActivate={false}
            />
        );
        expect(screen.getByText('Incomplete')).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Set active' })
        ).not.toBeInTheDocument();
    });

    it('will not offer to activate a routine that is over', () => {
        render(
            <RoutineCard
                {...props}
                finished
            />
        );
        expect(screen.getByText('Finished')).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Set active' })
        ).not.toBeInTheDocument();
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

    it('shows a badge instead of the button when already active', () => {
        render(
            <RoutineCard
                {...props}
                isActive
            />
        );
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Set active' })
        ).not.toBeInTheDocument();
    });
});
