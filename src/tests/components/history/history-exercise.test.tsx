import {
    HistoryExercise,
    type HistoryRow,
} from '@/components/history/history-exercise';
import type { ExerciseView } from '@/components/workout/workout-exercise';
import type { Effort } from '@/lib/progress';
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
    it('heads each row with the set and what it asks for', () => {
        show();
        expect(
            screen.getByRole('rowheader', { name: 'Set 1, 4-6 reps' })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('rowheader', { name: 'Set 2, AMRAP' })
        ).toBeInTheDocument();
    });

    it('gives every column its week', () => {
        show();
        expect(
            screen
                .getAllByRole('columnheader')
                .map((column) => column.textContent)
            // The first one is the corner the set column hangs under, which
            // names itself for a screen reader and shows nothing.
        ).toEqual(['Set', 'Week 1W1', 'Week 2W2', 'Week 3W3', 'Week 4W4']);
    });

    it('shows what was logged', () => {
        show();
        const shown = screen
            .getAllByRole('cell')
            .map(
                (cell) => cell.querySelector('span[aria-hidden]')?.textContent
            );
        expect(shown).toContain('80×5');
        expect(shown).toContain('82.5×5');
    });

    // Weight, then reps, then how it felt: a set answers on the first of those
    // that moved, and everything under it is carried by that answer.
    it('colours from the part that moved downwards', () => {
        const single: ExerciseView = {
            id: 'e1',
            name: 'Bench press',
            sets: [
                { repMode: 'fixed', repMin: 5, repMax: null, technique: null },
            ],
        };
        const log = (weight: number, reps: number, effort: Effort) => ({
            0: { weight, reps, effort },
        });

        render(
            <HistoryExercise
                exercise={single}
                rows={[
                    { week: 1, state: 'past', sets: log(80, 5, 'hard') },
                    // Same bar, same reps, a notch easier: the mark alone.
                    { week: 2, state: 'past', sets: log(80, 5, 'easy') },
                    // Same bar, a rep more: the reps and the mark beside them.
                    { week: 3, state: 'past', sets: log(80, 6, 'hard') },
                    // A heavier bar: all of it, whatever the reps did.
                    { week: 4, state: 'current', sets: log(82.5, 5, 'fail') },
                ]}
                position={0}
                total={1}
                onSelect={vi.fn()}
            />
        );

        const cells = screen.getAllByRole('cell');
        const parts = (cell: HTMLElement) => {
            const [weight, reps] = cell.querySelectorAll(
                'span[aria-hidden] > span'
            );
            return {
                weight: weight.className,
                reps: reps.className,
                mark: cell.querySelector('svg')!.getAttribute('class'),
            };
        };
        const green = expect.stringContaining('text-surge-ink');
        const ink = expect.stringContaining('text-ink');

        // Nothing to beat the first time the set appears.
        expect(parts(cells[0])).toEqual({ weight: ink, reps: ink, mark: ink });
        expect(parts(cells[1])).toEqual({
            weight: ink,
            reps: ink,
            mark: green,
        });
        expect(parts(cells[2])).toEqual({
            weight: ink,
            reps: green,
            mark: green,
        });
        expect(parts(cells[3])).toEqual({
            weight: green,
            reps: green,
            mark: green,
        });
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
