import {
    HistoryExercise,
    type HistoryRow,
} from '@/components/history/history-exercise';
import type { ExerciseView } from '@/components/workout/workout-exercise';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithLocale } from '@/tests/setup-helpers';

const exercise: ExerciseView = {
    id: 'e1',
    name: 'Bench press',
    sets: [
        { repMode: 'range', repMin: 4, repMax: 6, technique: 'Top set' },
        { repMode: 'amrap', repMin: null, repMax: null, technique: null },
    ],
};

/** Week 2 only got its top set in; week 3 is the one being trained, where the
    top set went backwards and the back-off repeated week 1 exactly; week 4 is
    still ahead. The blank in week 2 is therefore missed, the ones in week 4
    are not. */
const rows: HistoryRow[] = [
    {
        week: 1,
        state: 'past',
        sets: { 0: { weight: 80, reps: 5 }, 1: { weight: 60, reps: 12 } },
    },
    { week: 2, state: 'past', sets: { 0: { weight: 82.5, reps: 5 } } },
    {
        week: 3,
        state: 'current',
        sets: { 0: { weight: 80, reps: 4 }, 1: { weight: 60, reps: 12 } },
    },
    { week: 4, state: 'upcoming', sets: {} },
];

const show = (props: Partial<Parameters<typeof HistoryExercise>[0]> = {}) =>
    render(
        <HistoryExercise
            exercise={exercise}
            rows={rows}
            position={0}
            total={1}
            onSelect={vi.fn()}
            {...props}
        />
    );

describe('HistoryExercise', () => {
    it('heads each column with the set and what it asks for', () => {
        show();
        expect(
            screen.getByRole('columnheader', { name: 'Set 1, 4-6 reps' })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('columnheader', { name: 'Set 2, AMRAP' })
        ).toBeInTheDocument();
    });

    it('gives every row its week', () => {
        show();
        expect(
            screen.getAllByRole('rowheader').map((row) => row.textContent)
        ).toEqual(['Week 1W1', 'Week 2W2', 'Week 3W3', 'Week 4W4']);
    });

    it('shows what was logged', () => {
        show();
        expect(screen.getByText('80×5')).toBeInTheDocument();
        expect(screen.getByText('82.5×5')).toBeInTheDocument();
    });

    // The comparison is against the last week that set was logged in, not the
    // row above — week 2 never touched the back-off, so week 3 answers week 1.
    it('marks a set against the last time it was trained', () => {
        show();
        expect(
            screen.getByText('82.5 kg, 5 reps, Improved')
        ).toBeInTheDocument();
        expect(screen.getByText('80 kg, 4 reps, Dropped')).toBeInTheDocument();
        // Week 3 repeated week 1 to the kilo, so neither carries an arrow.
        expect(screen.getAllByText('60 kg, 12 reps')).toHaveLength(2);
    });

    it('leaves the first week of a set unmarked, having nothing to beat', () => {
        show();
        expect(screen.getByText('80 kg, 5 reps')).toBeInTheDocument();
    });

    // A blank a week behind is a set that was skipped; a blank a week ahead is
    // one that has not come round yet. Same empty cell, different news.
    it('tells a missed set from one still ahead', () => {
        show();
        expect(screen.getAllByText('Not logged')).toHaveLength(1);
        expect(screen.getAllByText('Not trained yet')).toHaveLength(2);
    });

    it('hides the pager when the exercise is the only one', () => {
        show();
        expect(
            screen.queryByRole('button', { name: 'Next exercise' })
        ).not.toBeInTheDocument();
    });

    it('pages, and stops at both ends', () => {
        const onSelect = vi.fn();
        const { rerender } = show({ position: 0, total: 3, onSelect });

        expect(
            screen.getByRole('button', { name: 'Previous exercise' })
        ).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: 'Next exercise' }));
        expect(onSelect).toHaveBeenCalledWith(1);

        rerender(
            <HistoryExercise
                exercise={exercise}
                rows={rows}
                position={2}
                total={3}
                onSelect={onSelect}
            />
        );
        expect(
            screen.getByRole('button', { name: 'Next exercise' })
        ).toBeDisabled();
        fireEvent.click(
            screen.getByRole('button', { name: 'Previous exercise' })
        );
        expect(onSelect).toHaveBeenLastCalledWith(1);
    });

    // "2/3" read aloud is a fraction, so the count is spelled out for a screen
    // reader and announced when it changes.
    it('announces which exercise is on screen', () => {
        show({ position: 1, total: 3 });
        expect(screen.getByRole('status')).toHaveTextContent(
            'Bench press, exercise 2 of 3'
        );
        expect(screen.getByText('2/3')).toBeInTheDocument();
    });

    it('captions the table with the exercise it belongs to', () => {
        show();
        expect(
            screen.getByText('Bench press: every set, week by week')
        ).toBeInTheDocument();
    });

    it('translates', () => {
        renderWithLocale(
            <HistoryExercise
                exercise={exercise}
                rows={rows}
                position={0}
                total={1}
                onSelect={vi.fn()}
            />,
            'es'
        );
        expect(screen.getAllByText('Sin registrar')).toHaveLength(1);
    });
});
