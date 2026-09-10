import {
    TodayWorkout,
    type TodayWorkoutProps,
} from '@/components/workout/today-workout';
import { useSessionStore } from '@/store/session';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { skipDay } from '@/app/actions';
import {
    acceptConfirm,
    confirmDialog,
    declineConfirm,
    openConfirm,
    withModals,
} from './setup-helpers';

vi.mock('@/app/actions', () => ({ logSet: vi.fn(), skipDay: vi.fn() }));
const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }));

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
                    {
                        repMode: 'range',
                        repMin: 4,
                        repMax: 6,
                        technique: 'Top set',
                    },
                    {
                        repMode: 'range',
                        repMin: 8,
                        repMax: 10,
                        technique: 'Back off',
                    },
                ],
            },
        ],
    },
    logs: {},
    previous: {},
};

const full = {
    e1: { 0: { weight: 80, reps: 8 }, 1: { weight: 60, reps: 10 } },
};

describe('TodayWorkout', () => {
    beforeEach(() => {
        useSessionStore.setState({ logs: {}, day: undefined });
        vi.clearAllMocks();
    });

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

    it('confirms before skipping an unfinished day', async () => {
        render(withModals(<TodayWorkout {...props} />));
        fireEvent.click(screen.getByText('Skip to next day'));
        expect(await openConfirm()).toBeInTheDocument();
        expect(skipDay).not.toHaveBeenCalled();

        await declineConfirm();
        expect(confirmDialog()).not.toBeInTheDocument();
        expect(skipDay).not.toHaveBeenCalled();
    });

    it('skips once the confirmation is accepted', async () => {
        render(withModals(<TodayWorkout {...props} />));
        fireEvent.click(screen.getByText('Skip to next day'));
        await acceptConfirm('Skip anyway');
        await waitFor(() => expect(skipDay).toHaveBeenCalledWith('r1'));
    });

    // The finished day is left behind by the next fetch, so skipping it too
    // would cost the user the day after it.
    it('only refreshes when the day is already finished', () => {
        render(
            <TodayWorkout
                {...props}
                logs={full}
            />
        );
        fireEvent.click(screen.getByText('Skip to next day'));
        expect(skipDay).not.toHaveBeenCalled();
        expect(refresh).toHaveBeenCalled();
    });

    // Coming back from the history replays the payload this page was rendered
    // with, from before the set was logged. Hydrating from it again would empty
    // the field until the next reload.
    it('keeps what was logged when the same day comes back stale', () => {
        const { rerender } = render(<TodayWorkout {...props} />);
        useSessionStore.getState().save('e1', 0, { weight: 80, reps: 8 });
        rerender(
            <TodayWorkout
                {...props}
                logs={{}}
            />
        );
        expect(screen.getByLabelText('Weight set 1')).toHaveValue(80);
    });

    // A one-day routine comes round again under the same workout id, and week 2
    // starts empty however week 1 ended.
    it('reloads the day when the week moves on', () => {
        const { rerender } = render(
            <TodayWorkout
                {...props}
                logs={full}
            />
        );
        rerender(
            <TodayWorkout
                {...props}
                week={3}
                logs={{}}
            />
        );
        expect(screen.getByLabelText('Weight set 1')).toHaveValue(null);
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
