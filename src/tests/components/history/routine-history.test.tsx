import {
    RoutineHistory,
    type HistoryDay,
} from '@/components/history/routine-history';
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
    the week number resolves to the day being looked at.

    Weeks run across the table, so a week is a column: find where its heading
    sits and take that cell out of the set row wanted. The corner heading and
    each row's own set heading share position 0, so the two line up. */
const weekHead = (week: string) =>
    screen
        .getAllByRole('columnheader')
        .find((head) => head.textContent?.startsWith(week))!;

const weekCell = (week: string, setRow: number) => {
    const index = screen.getAllByRole('columnheader').indexOf(weekHead(week));
    return screen.getAllByRole('row')[setRow + 1].children[
        index
    ] as HTMLElement;
};

/** A value is drawn in pieces — the weight, the reps, and the slot the effort
    mark sits in — each coloured on its own, so it is read off the cell whole
    or a piece at a time rather than matched as one run of text. */
const shown = (cell: HTMLElement) =>
    cell.querySelector('span[aria-hidden]')?.textContent;

const numberParts = (cell: HTMLElement) => {
    const [weight, reps] = cell.querySelectorAll('span[aria-hidden] > span');
    return { weight, reps };
};

const tab = (n: number) =>
    screen.getByRole('tab', { name: new RegExp(`^Day ${n},`) });

describe('RoutineHistory', () => {
    it('lays every week of the routine out against every set', () => {
        render(<RoutineHistory {...base} />);

        // Three weeks of columns, whether or not they were ever trained, plus
        // the corner the set column hangs under.
        expect(screen.getAllByRole('columnheader')).toHaveLength(4);
        expect(
            screen.getByRole('rowheader', { name: /^Set 1, 4-6 reps/ })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('rowheader', { name: /^Set 2, AMRAP/ })
        ).toBeInTheDocument();
    });

    it('shows what was logged, week by week', () => {
        render(<RoutineHistory {...base} />);
        expect(shown(weekCell('Week 1', 0))).toBe('80×5');
        expect(shown(weekCell('Week 2', 0))).toBe('82.5×5');
    });

    // The whole point of the page: a blank has to say which kind of blank it is,
    // and say it in words rather than in a shade of grey.
    it('tells a week that was skipped from one that has not come round', () => {
        render(<RoutineHistory {...base} />);
        // Week 2 day 1 is behind the cursor (4), so its empty set was missed.
        expect(
            within(weekCell('Week 2', 1)).getByText('Not logged')
        ).toBeInTheDocument();
        // Week 3 day 1 is cursor 4 — the day being trained right now.
        expect(
            within(weekCell('Week 3', 0)).getByText('Not trained yet')
        ).toBeInTheDocument();
        expect(
            within(weekCell('Week 3', 1)).getByText('Not trained yet')
        ).toBeInTheDocument();
    });

    it('marks the day being trained, and the weeks already banked', () => {
        render(<RoutineHistory {...base} />);
        expect(weekHead('Week 1')).toHaveClass('border-b-surge');
        expect(weekHead('Week 2')).toHaveClass('border-b-line');
        expect(weekHead('Week 3')).toHaveClass('border-b-volt');
    });

    // The verdict is judged against the last week that set was logged, so the
    // very first time a set appears there is nothing to compare it with.
    it('marks a set that moved on from its last record', () => {
        render(<RoutineHistory {...base} />);
        expect(
            within(weekCell('Week 2', 0)).getByText('82.5 kg, 5 reps, Improved')
        ).toBeInTheDocument();
        expect(
            within(weekCell('Week 1', 0)).getByText('80 kg, 5 reps')
        ).toBeInTheDocument();
    });

    // Nothing sits beside the number any more, so the number itself has to
    // carry the news — and go back to plain ink when there is none. 82.5×5
    // after 80×5 moved the bar, so the whole set reads as the gain.
    it('prints the verdict into the numbers themselves', () => {
        render(<RoutineHistory {...base} />);
        const up = numberParts(weekCell('Week 2', 0));
        expect(up.weight).toHaveClass('text-surge-ink');
        expect(up.reps).toHaveClass('text-surge-ink');

        const first = numberParts(weekCell('Week 1', 0));
        expect(first.weight).toHaveClass('text-ink');
        expect(first.reps).toHaveClass('text-ink');
    });

    // The set label has to survive scrolling sideways through the weeks.
    it('pins the set column', () => {
        render(<RoutineHistory {...base} />);
        expect(screen.getByRole('rowheader', { name: /^Set 1/ })).toHaveClass(
            'sticky',
            'left-0',
            'bg-surface'
        );
        expect(screen.getByRole('columnheader', { name: 'Set' })).toHaveClass(
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
