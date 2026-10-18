import {
    TodayWorkout,
    type TodayWorkoutProps,
} from '@/components/workout/today-workout';
import { useSessionStore } from '@/store/session';
import { useToastStore } from '@/store/toast';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cancelDay, logSet, skipDay, startDay } from '@/app/actions';
import {
    acceptConfirm,
    confirmDialog,
    declineConfirm,
    openConfirm,
    withModals,
} from '@/tests/setup-helpers';

vi.mock('@/app/actions', () => ({
    cancelDay: vi.fn(),
    logSet: vi.fn(),
    skipDay: vi.fn(),
    startDay: vi.fn(),
}));
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
    started: true,
    logs: {},
    previous: {},
};

const full = {
    e1: { 0: { weight: 80, reps: 8 }, 1: { weight: 60, reps: 10 } },
};

describe('TodayWorkout', () => {
    beforeEach(() => {
        useSessionStore.setState({
            logs: {},
            day: undefined,
        });
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

    // A routine's day is read before it is trained: the plan, no fields.
    // Starting it is the server's to record, and the day it sends back is the
    // one under way.
    it('shows the day as a preview until it is started', async () => {
        const { rerender } = render(
            <TodayWorkout
                {...props}
                started={false}
            />
        );
        expect(screen.getByText('Bench press')).toBeInTheDocument();
        expect(screen.queryByLabelText('Weight set 1')).not.toBeInTheDocument();
        expect(screen.queryByText('Skip to next day')).not.toBeInTheDocument();
        // No progress to show for a day not yet under way.
        expect(screen.queryByText('0/2 sets')).not.toBeInTheDocument();
        expect(screen.queryByRole('img', { name: '0/2 sets' })).toBeNull();

        fireEvent.click(screen.getByText('Start workout'));
        await waitFor(() => expect(startDay).toHaveBeenCalledWith('w1', 2));

        rerender(<TodayWorkout {...props} />);
        expect(screen.getByText('0/2 sets')).toBeInTheDocument();
        expect(screen.getByLabelText('Weight set 1')).toBeEnabled();
        expect(screen.getByLabelText('Weight set 2')).toBeDisabled();
        expect(screen.getByText('Finish workout')).toBeInTheDocument();
    });

    // Coming back to a day with anything logged lands in it, not on its preview.
    it('opens the next set once the previous one is logged', () => {
        render(
            <TodayWorkout
                {...props}
                logs={{ e1: { 0: { weight: 80, reps: 8 } } }}
            />
        );
        expect(screen.queryByText('Start workout')).not.toBeInTheDocument();
        expect(screen.getByLabelText('Weight set 2')).toBeEnabled();
    });

    // Nothing logged, nothing to end: it goes back to being read, and the day
    // stays where it is.
    it('calls the day off when finished with nothing logged, once confirmed', async () => {
        useToastStore.setState({ toasts: [] });
        render(withModals(<TodayWorkout {...props} />));
        fireEvent.click(screen.getByText('Finish workout'));
        expect(await openConfirm()).toHaveTextContent(
            'You have not logged a single set'
        );
        await acceptConfirm('Finish anyway');
        await waitFor(() => expect(cancelDay).toHaveBeenCalledWith('w1', 2));
        expect(skipDay).not.toHaveBeenCalled();
        await waitFor(() =>
            expect(useToastStore.getState().toasts).toMatchObject([
                { message: 'Workout called off', kind: 'success' },
            ])
        );
    });

    it('confirms before finishing a day half done', async () => {
        render(
            withModals(
                <TodayWorkout
                    {...props}
                    logs={{ e1: { 0: { weight: 80, reps: 8 } } }}
                />
            )
        );
        fireEvent.click(screen.getByText('Finish workout'));
        expect(await openConfirm()).toHaveTextContent(
            'The sets you left blank stay blank'
        );
        expect(skipDay).not.toHaveBeenCalled();

        await declineConfirm();
        expect(confirmDialog()).not.toBeInTheDocument();
        expect(skipDay).not.toHaveBeenCalled();
    });

    it('moves on to the next day once the confirmation is accepted', async () => {
        useToastStore.setState({ toasts: [] });
        render(
            withModals(
                <TodayWorkout
                    {...props}
                    logs={{ e1: { 0: { weight: 80, reps: 8 } } }}
                />
            )
        );
        fireEvent.click(screen.getByText('Finish workout'));
        await acceptConfirm('Finish anyway');
        await waitFor(() => expect(skipDay).toHaveBeenCalledWith('r1'));
        await waitFor(() =>
            expect(useToastStore.getState().toasts).toMatchObject([
                { message: 'Workout finished', kind: 'success' },
            ])
        );
    });

    it('raises an error toast when finishing fails', async () => {
        vi.mocked(skipDay).mockRejectedValueOnce(new Error('boom'));
        useToastStore.setState({ toasts: [] });
        render(
            withModals(
                <TodayWorkout
                    {...props}
                    logs={{ e1: { 0: { weight: 80, reps: 8 } } }}
                />
            )
        );
        fireEvent.click(screen.getByText('Finish workout'));
        await acceptConfirm('Finish anyway');
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
        fireEvent.click(screen.getByText('Finish workout'));
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

describe('TodayWorkout, for a workout', () => {
    const workout = {
        ...props,
        routineName: 'Legs',
        week: 3,
        totalWeeks: null,
        kind: 'workout' as const,
    };

    beforeEach(() => {
        useSessionStore.setState({
            logs: {},
            day: undefined,
        });
        useToastStore.setState({ toasts: [] });
        vi.clearAllMocks();
    });

    // There are no weeks: the badge counts which time this is.
    it('says which time it is rather than which week', () => {
        render(<TodayWorkout {...workout} />);
        expect(screen.getByText('Session 3')).toBeInTheDocument();
        expect(screen.queryByText(/Week/)).not.toBeInTheDocument();
        expect(screen.getByText('Workout')).toBeInTheDocument();
    });

    it('is finished rather than skipped, once confirmed', async () => {
        render(
            withModals(
                <TodayWorkout
                    {...workout}
                    logs={{ e1: { 0: { weight: 80, reps: 8 } } }}
                />
            )
        );
        expect(screen.queryByText('Start workout')).not.toBeInTheDocument();
        fireEvent.click(screen.getByText('Finish workout'));
        expect(await openConfirm()).toHaveTextContent(
            'The sets you left blank stay blank'
        );
        await acceptConfirm('Finish anyway');
        await waitFor(() => expect(skipDay).toHaveBeenCalledWith('r1'));
        await waitFor(() =>
            expect(useToastStore.getState().toasts).toMatchObject([
                { message: 'Workout finished', kind: 'success' },
            ])
        );
    });

    // With nothing logged it is called off, not counted, and says so.
    it('warns that finishing with nothing logged calls it off', async () => {
        render(withModals(<TodayWorkout {...workout} />));
        fireEvent.click(screen.getByText('Finish workout'));
        expect(await openConfirm()).toHaveTextContent(
            'You have not logged a single set'
        );
        await acceptConfirm('Finish anyway');
        await waitFor(() => expect(skipDay).toHaveBeenCalledWith('r1'));
        await waitFor(() =>
            expect(useToastStore.getState().toasts).toMatchObject([
                { message: 'Workout called off', kind: 'success' },
            ])
        );
    });

    // Done in full there are no blanks to warn about: it simply ends.
    it('finishes without asking once every set is in', async () => {
        render(
            withModals(
                <TodayWorkout
                    {...workout}
                    logs={full}
                />
            )
        );
        fireEvent.click(screen.getByText('Finish workout'));
        expect(confirmDialog()).not.toBeInTheDocument();
        await waitFor(() => expect(skipDay).toHaveBeenCalledWith('r1'));
        await waitFor(() =>
            expect(useToastStore.getState().toasts).toMatchObject([
                { message: 'Workout finished', kind: 'success' },
            ])
        );
    });
});
