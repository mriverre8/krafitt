import { RoutineHistory, type HistoryDay } from '@/components/history/routine-history';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const sets = [
    { repMode: 'range', repMin: 4, repMax: 6, technique: 'Top set' },
    { repMode: 'amrap', repMin: null, repMax: null, technique: 'Back off' },
];

const exercise = (id: string, name: string) => ({ id, name, sets });

/** Two days a week over three weeks, so the cursor walks 0=W1D1, 1=W1D2,
    2=W2D1... Only Push A was ever trained, and only week 1 of it in full. */
const days: HistoryDay[] = [
    {
        id: 'w1',
        name: 'Push A',
        exercises: [
            exercise('e1', 'Bench press'),
            exercise('e2', 'Incline press'),
        ],
        weeks: {
            1: {
                e1: { 0: { weight: 80, reps: 5 }, 1: { weight: 60, reps: 12 } },
                e2: { 0: { weight: 40, reps: 8 }, 1: { weight: 30, reps: 15 } },
            },
            // Week 2 was started and abandoned: the second set never happened.
            2: { e1: { 0: { weight: 82.5, reps: 5 } } },
        },
    },
    {
        id: 'w2',
        name: 'Pull A',
        exercises: [exercise('e3', 'Row')],
        weeks: {},
    },
];

const base = { days, durationWeeks: 3, cursor: 4 };

/** Every day stays mounted, but only the one on screen is in the a11y tree, so
    the week number resolves to the day being looked at. */
const rowOf = (week: string) =>
    screen.getByRole('rowheader', { name: week }).closest('tr')!;

const tab = (n: number) =>
    screen.getByRole('tab', { name: new RegExp(`^Day ${n},`) });

describe('RoutineHistory', () => {
    it('lays every week of the routine out against every set', () => {
        render(<RoutineHistory {...base} />);

        // Three weeks of rows, whether or not they were ever trained.
        expect(screen.getAllByRole('rowheader')).toHaveLength(3);
        expect(
            screen.getByRole('columnheader', { name: /^Set 1, 4-6 reps/ })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('columnheader', { name: /^Set 2, AMRAP/ })
        ).toBeInTheDocument();
    });

    it('shows what was logged, week by week', () => {
        render(<RoutineHistory {...base} />);
        expect(within(rowOf('Week 1')).getByText('80×5')).toBeInTheDocument();
        expect(within(rowOf('Week 2')).getByText('82.5×5')).toBeInTheDocument();
    });

    // The whole point of the page: a blank has to say which kind of blank it is,
    // and say it in words rather than in a shade of grey.
    it('tells a week that was skipped from one that has not come round', () => {
        render(<RoutineHistory {...base} />);
        // Week 2 day 1 is behind the cursor (4), so its empty set was missed.
        expect(
            within(rowOf('Week 2')).getByText('Not logged')
        ).toBeInTheDocument();
        // Week 3 day 1 is cursor 4 — the day being trained right now.
        expect(
            within(rowOf('Week 3')).getAllByText('Not trained yet')
        ).toHaveLength(2);
    });

    it('marks the day being trained, and the weeks already banked', () => {
        render(<RoutineHistory {...base} />);
        expect(rowOf('Week 1').firstElementChild).toHaveClass('border-l-surge');
        expect(rowOf('Week 2').firstElementChild).toHaveClass('border-l-line');
        expect(rowOf('Week 3').firstElementChild).toHaveClass('border-l-volt');
    });

    // The arrow is judged against the last week that set was logged, so the very
    // first time a set appears there is nothing to compare it with.
    it('marks a set that moved on from its last record', () => {
        render(<RoutineHistory {...base} />);
        expect(
            within(rowOf('Week 2')).getByText('82.5 kg, 5 reps, Improved')
        ).toBeInTheDocument();
        expect(
            within(rowOf('Week 1')).getByText('80 kg, 5 reps')
        ).toBeInTheDocument();
    });

    // The week label has to survive scrolling sideways through the sets.
    it('pins the week column', () => {
        render(<RoutineHistory {...base} />);
        expect(rowOf('Week 1').firstElementChild).toHaveClass(
            'sticky',
            'left-0',
            'bg-surface'
        );
        expect(screen.getByRole('columnheader', { name: 'Week' })).toHaveClass(
            'sticky',
            'left-0',
            'bg-surface'
        );
    });

    // Focus stays on the arrow, so the exercise that arrived has to say so
    // itself — and say which one it is, not just a number.
    it('announces the exercise that paging brought in', () => {
        render(<RoutineHistory {...base} />);
        const status = screen.getAllByRole('status')[0];
        expect(status).toHaveTextContent('Bench press, exercise 1 of 2');
        expect(status).toHaveTextContent('1/2');

        fireEvent.click(screen.getByRole('button', { name: 'Next exercise' }));
        expect(screen.getAllByRole('status')[0]).toHaveTextContent(
            'Incline press, exercise 2 of 2'
        );
    });

    // Each day keeps its own place: a day with one exercise has nothing to page.
    it('keeps each day on the exercise it was left on, and hides a pager of one', () => {
        render(<RoutineHistory {...base} />);
        fireEvent.click(screen.getByRole('button', { name: 'Next exercise' }));

        fireEvent.click(tab(2));
        expect(screen.getByRole('heading', { name: 'Row' })).toBeVisible();
        expect(
            screen.queryByRole('button', { name: 'Next exercise' })
        ).not.toBeInTheDocument();

        fireEvent.click(tab(1));
        expect(
            screen.getByRole('heading', { name: 'Incline press' })
        ).toBeVisible();
    });

    it('pages through the days the way the routine itself does', () => {
        render(<RoutineHistory {...base} />);
        const panel = (name: string) =>
            screen
                .getByRole('heading', { name, hidden: true })
                .closest('[role="tabpanel"]');

        expect(panel('Push A')).toBeVisible();
        expect(panel('Pull A')).not.toBeVisible();

        fireEvent.click(tab(2));
        expect(panel('Pull A')).toBeVisible();
        expect(panel('Push A')).not.toBeVisible();
    });

    it('has nothing to show for a routine with no days', () => {
        const { container } = render(
            <RoutineHistory
                {...base}
                days={[]}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });
});
