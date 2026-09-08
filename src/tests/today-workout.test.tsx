import {
    TodayWorkout,
    type TodayWorkoutProps,
} from '@/components/today-workout';
import { useSessionStore } from '@/store/session';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/actions', () => ({ logSet: vi.fn(), skipDay: vi.fn() }));

const props: TodayWorkoutProps = {
    routineId: 'r1',
    routineName: 'Strength',
    week: 2,
    totalWeeks: 8,
    workout: {
        id: 'w1',
        name: 'Push A',
        exercises: [
            {
                id: 'e1',
                name: 'Bench press',
                sets: [
                    { repMin: 4, repMax: 6, technique: 'Top set' },
                    { repMin: 8, repMax: 10, technique: 'Back off' },
                ],
            },
        ],
    },
    logs: {},
    previous: {},
    previousWeek: null,
};

describe('TodayWorkout', () => {
    beforeEach(() => useSessionStore.setState({ logs: {} }));

    it('shows the routine, day and week', () => {
        render(<TodayWorkout {...props} />);
        expect(screen.getByText('Push A')).toBeInTheDocument();
        expect(screen.getByText('Week 2 of 8')).toBeInTheDocument();
    });

    // No start button any more: the first set is open from the moment the day
    // is on screen, and logging it is what opens the session.
    it('opens the first set straight away and locks the rest', () => {
        render(<TodayWorkout {...props} />);
        expect(screen.getByLabelText('Weight set 1')).toBeEnabled();
        expect(screen.getByLabelText('Weight set 2')).toBeDisabled();
    });

    it('opens the next set once the previous one is logged', () => {
        render(
            <TodayWorkout
                {...props}
                logs={{ e1: { 0: { weight: 80, reps: 8 } } }}
            />
        );
        expect(screen.getByLabelText('Weight set 2')).toBeEnabled();
    });

    it('says so when the day has no exercises', () => {
        render(
            <TodayWorkout
                {...props}
                workout={{ ...props.workout, exercises: [] }}
            />
        );
        expect(
            screen.getByText('This workout has no exercises yet.')
        ).toBeInTheDocument();
    });
});
