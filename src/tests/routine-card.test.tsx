import { RoutineCard, type RoutineCardProps } from '@/components/routine-card';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const props: RoutineCardProps = {
    id: 'r1',
    name: 'Strength',
    durationWeeks: 4,
    workoutCount: 3,
    cursor: 6,
    isActive: false,
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
