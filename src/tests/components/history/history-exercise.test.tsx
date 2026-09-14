import { HistoryExercise } from '@/components/history/history-exercise';
import type { ExerciseView, HistoryRow } from '@/lib/types';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const exercise: ExerciseView = {
    id: 'e1',
    name: 'Bench press',
    sets: [
        { repMode: 'range', repMin: 4, repMax: 6, technique: 'Top set' },
        { repMode: 'amrap', repMin: null, repMax: null, technique: 'Back off' },
    ],
};

/** Week 2 went by unlogged, week 4 has not come round yet. Set 1 therefore has
    to be judged against week 1 — three weeks back — when it lands in week 3. */
const rows: HistoryRow[] = [
    {
        week: 1,
        state: 'past',
        sets: { 0: { weight: 80, reps: 5 }, 1: { weight: 60, reps: 12 } },
    },
    { week: 2, state: 'past', sets: {} },
    {
        week: 3,
        state: 'current',
        sets: { 0: { weight: 82.5, reps: 5 }, 1: { weight: 55, reps: 12 } },
    },
    { week: 4, state: 'upcoming', sets: {} },
];

const base = {
    exercise,
    rows,
    position: 0,
    total: 2,
    onSelect: vi.fn(),
};

const rowOf = (week: string) =>
    screen.getByRole('rowheader', { name: week }).closest('tr')!;

describe('HistoryExercise', () => {
    // A week per row and a set per column: a routine grows in weeks, never in
    // sets, so this is the way round that keeps fitting a phone.
    it('lays every week out against every set', () => {
        render(<HistoryExercise {...base} />);
        expect(screen.getAllByRole('rowheader')).toHaveLength(4);
        expect(
            screen.getByRole('columnheader', { name: /^Set 1, 4-6 reps/ })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('columnheader', { name: /^Set 2, AMRAP/ })
        ).toBeInTheDocument();
    });

    it('shows what was logged, week by week', () => {
        render(<HistoryExercise {...base} />);
        expect(within(rowOf('Week 1')).getByText('80×5')).toBeInTheDocument();
        expect(within(rowOf('Week 3')).getByText('82.5×5')).toBeInTheDocument();
    });

    // Each set is judged against the last week that set was actually logged,
    // however many skipped weeks lie between — and the first time a set appears
    // there is nothing to judge it against.
    it('marks a set against its own last record, across the gap', () => {
        render(<HistoryExercise {...base} />);
        const week3 = within(rowOf('Week 3'));
        expect(
            week3.getByText('82.5 kg, 5 reps, Improved')
        ).toBeInTheDocument();
        expect(week3.getByText('55 kg, 12 reps, Dropped')).toBeInTheDocument();
        expect(
            within(rowOf('Week 1')).getByText('80 kg, 5 reps')
        ).toBeInTheDocument();
    });

    // A blank is never just blank, and the wording has to carry it for anyone
    // not reading the shape.
    it('tells a week that was skipped from one still ahead', () => {
        render(<HistoryExercise {...base} />);
        expect(within(rowOf('Week 2')).getAllByText('Not logged')).toHaveLength(
            2
        );
        expect(
            within(rowOf('Week 4')).getAllByText('Not trained yet')
        ).toHaveLength(2);
    });

    it('marks the week being trained, and the weeks banked in full', () => {
        render(<HistoryExercise {...base} />);
        expect(rowOf('Week 1').firstElementChild).toHaveClass('border-l-surge');
        expect(rowOf('Week 2').firstElementChild).toHaveClass('border-l-line');
        expect(rowOf('Week 3').firstElementChild).toHaveClass('border-l-volt');
    });

    it('pages to the exercise either side of this one', () => {
        const onSelect = vi.fn();
        render(
            <HistoryExercise
                {...base}
                position={1}
                onSelect={onSelect}
            />
        );
        fireEvent.click(
            screen.getByRole('button', { name: 'Previous exercise' })
        );
        expect(onSelect).toHaveBeenCalledWith(0);
        expect(
            screen.getByRole('button', { name: 'Next exercise' })
        ).toBeDisabled();
    });

    // Focus stays on the arrow, so the count has to announce itself — and name
    // the exercise, not just a number.
    it('announces which exercise is on screen', () => {
        render(
            <HistoryExercise
                {...base}
                onSelect={vi.fn()}
            />
        );
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent('Bench press, exercise 1 of 2');
        expect(status).toHaveTextContent('1/2');
        expect(
            screen.getByRole('button', { name: 'Previous exercise' })
        ).toBeDisabled();
    });

    // A rack of numbered plates sits a few lines above; a second one here would
    // be read as that control gone wrong. One exercise has nothing to page.
    it('hides the pager when the day holds a single exercise', () => {
        render(
            <HistoryExercise
                {...base}
                total={1}
                onSelect={vi.fn()}
            />
        );
        expect(
            screen.queryByRole('button', { name: 'Next exercise' })
        ).not.toBeInTheDocument();
    });
});
