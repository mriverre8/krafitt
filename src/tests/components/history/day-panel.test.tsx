import {
    DayPanel,
    type HistoryDay,
    type WeekRow,
} from '@/components/history/day-panel';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const sets = [
    { repMode: 'range', repMin: 4, repMax: 6, technique: 'Top set' },
    { repMode: 'amrap', repMin: null, repMax: null, technique: 'Back off' },
];

const exercise = (id: string, name: string) => ({ id, name, sets });

/** Week 1 was logged in full; week 2 was started and abandoned on the second
    set of the first exercise, so it does not count as trained. */
const day: HistoryDay = {
    id: 'w1',
    name: 'Push A',
    exercises: [exercise('e1', 'Bench press'), exercise('e2', 'Incline press')],
    weeks: {
        1: {
            e1: { 0: { weight: 80, reps: 5 }, 1: { weight: 60, reps: 12 } },
            e2: { 0: { weight: 40, reps: 8 }, 1: { weight: 30, reps: 15 } },
        },
        2: { e1: { 0: { weight: 82.5, reps: 5 } } },
    },
};

const rows: WeekRow[] = [
    { week: 1, state: 'past', logs: day.weeks[1] },
    { week: 2, state: 'past', logs: day.weeks[2] },
    { week: 3, state: 'current', logs: {} },
];

const base = {
    day,
    durationWeeks: 3,
    rows,
    id: 'panel-0',
    labelledBy: 'tab-0',
    hidden: false,
};

describe('DayPanel', () => {
    it('counts only the weeks where the whole day was logged', () => {
        render(<DayPanel {...base} />);
        expect(screen.getByText('Push A')).toBeInTheDocument();
        expect(screen.getByText('1/3 weeks done')).toBeInTheDocument();
    });

    // Two glyphs stand in for the blanks in the grid, and neither is obvious
    // on sight.
    it('spells out what an empty cell means', () => {
        // Only the week that was logged in full, so the words below can only be
        // coming from the legend and not from a blank in the grid.
        render(
            <DayPanel
                {...base}
                rows={[rows[0]]}
                durationWeeks={1}
            />
        );
        expect(screen.getByText('Not logged')).toBeInTheDocument();
        expect(screen.getByText('Not trained yet')).toBeInTheDocument();
    });

    // One exercise on screen at a time, walked with the arrows in its header.
    it('pages through the exercises of the day', () => {
        render(<DayPanel {...base} />);
        const next = screen.getByRole('button', { name: 'Next exercise' });
        const previous = screen.getByRole('button', {
            name: 'Previous exercise',
        });

        expect(
            screen.getByRole('heading', { name: 'Bench press' })
        ).toBeVisible();
        expect(previous).toBeDisabled();

        fireEvent.click(next);
        expect(
            screen.getByRole('heading', { name: 'Incline press' })
        ).toBeVisible();
        expect(
            screen.queryByRole('heading', { name: 'Bench press' })
        ).not.toBeInTheDocument();
        expect(next).toBeDisabled();
    });

    it('says so when the day has no exercises', () => {
        render(
            <DayPanel
                {...base}
                day={{ ...day, exercises: [] }}
            />
        );
        expect(
            screen.getByText('This workout has no exercises yet.')
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Next exercise' })
        ).not.toBeInTheDocument();
    });

    // It is one tab panel among several, and the switcher's tab names it.
    it('is a tab panel the day switcher can address', () => {
        render(
            <DayPanel
                {...base}
                hidden
            />
        );
        const panel = screen.getByRole('tabpanel', { hidden: true });
        expect(panel).toHaveAttribute('id', 'panel-0');
        expect(panel).toHaveAttribute('aria-labelledby', 'tab-0');
        expect(panel).not.toBeVisible();
    });
});
