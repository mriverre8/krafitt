import {
    TodayWorkout,
    type TodayWorkoutProps,
} from '@/components/workout/today-workout';
import { useSessionStore } from '@/store/session';
import { useToastStore } from '@/store/toast';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { logSet, skipDay } from '@/app/actions';
import {
    acceptConfirm,
    confirmDialog,
    declineConfirm,
    openConfirm,
    withModals,
} from '@/tests/setup-helpers';

vi.mock('@/app/actions', () => ({ logSet: vi.fn(), skipDay: vi.fn() }));
const refresh = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ refresh }),
    unstable_rethrow: () => {},
}));

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
    day: 1,
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

    it('opens the history on the day being trained', () => {
        render(<TodayWorkout {...props} />);
        expect(screen.getByRole('link')).toHaveAttribute(
            'href',
            '/progress/r1?currentDay=1'
        );
    });

    // A routine with one day in it comes round again under the same workout
    // and exercise ids, so nothing in the tree changes identity when the day
    // does — and a row would sit there still holding what was typed into it
    // last time round.
    it('starts the next day with empty fields', async () => {
        const { rerender } = render(<TodayWorkout {...props} />);
        fireEvent.change(screen.getByLabelText('Weight set 1'), {
            target: { value: '80' },
        });
        fireEvent.change(screen.getByLabelText('Reps set 1'), {
            target: { value: '8' },
        });
        fireEvent.click(screen.getByLabelText('Save set 1'));
        fireEvent.click(screen.getByLabelText('Bank set 1'));
        await waitFor(() =>
            expect(screen.getByLabelText('Weight set 1')).toHaveValue('80')
        );

        rerender(
            <TodayWorkout
                {...props}
                week={3}
                logs={{}}
            />
        );
        await waitFor(() =>
            expect(screen.getByLabelText('Weight set 1')).toHaveValue('')
        );
        expect(screen.getByLabelText('Reps set 1')).toHaveValue('');
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
        await waitFor(() =>
            expect(useToastStore.getState().toasts).toMatchObject([
                { message: 'Day skipped', kind: 'success' },
            ])
        );
    });

    it('raises an error toast when the skip fails', async () => {
        vi.mocked(skipDay).mockRejectedValueOnce(new Error('boom'));
        useToastStore.setState({ toasts: [] });
        render(withModals(<TodayWorkout {...props} />));
        fireEvent.click(screen.getByText('Skip to next day'));
        await acceptConfirm('Skip anyway');
        await waitFor(() =>
            expect(useToastStore.getState().toasts).toMatchObject([
                { message: 'Something went wrong', kind: 'error' },
            ])
        );
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
        expect(useToastStore.getState().toasts).toEqual([]);
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
        expect(screen.getByLabelText('Weight set 1')).toHaveValue('80');
    });

    // The plan can change under an open screen, so a set is named by its slot
    // rather than its place: the server refuses one the plan no longer has.
    it('logs a set under its slot', async () => {
        render(<TodayWorkout {...props} />);
        fireEvent.change(screen.getByLabelText('Weight set 1'), {
            target: { value: '80' },
        });
        fireEvent.change(screen.getByLabelText('Reps set 1'), {
            target: { value: '5' },
        });
        fireEvent.click(screen.getByLabelText('Save set 1'));
        fireEvent.click(screen.getByLabelText('Bank set 1'));
        await waitFor(() =>
            expect(logSet).toHaveBeenCalledWith(
                'w1',
                2,
                'e1',
                '1',
                80,
                5,
                'normal'
            )
        );
    });

    // The store holds logs by place, and an edit moves sets about: a day
    // whose plan changed is loaded afresh rather than read in the old places.
    it('reloads the day when its plan has changed', () => {
        const { rerender } = render(
            <TodayWorkout
                {...props}
                logs={full}
            />
        );
        const [top, back] = props.workout.exercises[0].sets;
        rerender(
            <TodayWorkout
                {...props}
                workout={{
                    ...props.workout,
                    exercises: [
                        {
                            ...props.workout.exercises[0],
                            sets: [top, { ...top, kind: 'drop' }, back],
                        },
                    ],
                }}
                logs={{ e1: { 0: full.e1[0], 2: full.e1[1] } }}
            />
        );
        expect(screen.getByLabelText('Weight set DS1')).toHaveValue('');
        expect(screen.getByLabelText('Weight set 2')).toHaveValue('60');
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
        expect(screen.getByLabelText('Weight set 1')).toHaveValue('');
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
