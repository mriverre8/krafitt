import { TrainingYear } from '@/components/profile/training-year';
import { renderWithLocale } from '@/tests/setup-helpers';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

/** A Wednesday. 2026 opens on a Thursday and closes on a Thursday, so the grid
    borrows three days from 2025 and three from 2027: 53 columns. */
const END = '2026-09-09';

const cells = (container: HTMLElement) => [
    ...container.querySelectorAll<HTMLElement>('[role="img"] > span'),
];

describe('TrainingYear', () => {
    it('draws whole weeks from January to December', () => {
        const { container } = renderWithLocale(
            <TrainingYear
                days={{}}
                end={END}
            />
        );
        expect(cells(container)).toHaveLength(53 * 7);
        expect(
            screen.getByRole('heading', { name: 'Training year 2026' })
        ).toBeInTheDocument();

        // January first, December last, in order.
        const months = [...container.querySelectorAll('[aria-hidden] > span')]
            .map((span) => span.textContent)
            .slice(0, 12);
        expect(months[0]).toBe('Jan');
        expect(months.at(-1)).toBe('Dec');
    });

    it('fills a trained day harder the more sets it holds', () => {
        renderWithLocale(
            <TrainingYear
                days={{
                    '2026-09-07': 6,
                    '2026-09-08': 14,
                    '2026-09-09': 24,
                }}
                end={END}
            />
        );
        expect(screen.getByTitle('6 sets · September 7').className).toContain(
            'bg-volt/30'
        );
        expect(screen.getByTitle('14 sets · September 8').className).toContain(
            'bg-volt/65'
        );
        expect(screen.getByTitle('24 sets · September 9').className).toContain(
            'bg-volt'
        );
        expect(screen.getByTitle('Rest · September 6').className).toContain(
            'bg-surface2'
        );

        expect(screen.getByText('3 days trained')).toBeInTheDocument();
        // The legend keys the same four fills, weakest first.
        const legend = screen.getByText(/Less/).querySelectorAll('span');
        expect([...legend].map((span) => span.className)).toEqual([
            'size-2.5 rounded-xs bg-surface2',
            'size-2.5 rounded-xs bg-volt/30',
            'size-2.5 rounded-xs bg-volt/65',
            'size-2.5 rounded-xs bg-volt',
        ]);
        expect(
            screen.getByRole('img', {
                name: 'Training year 2026: 3 days trained',
            })
        ).toBeInTheDocument();
    });

    it('leaves days to come and days outside the year blank', () => {
        const { container } = renderWithLocale(
            <TrainingYear
                days={{}}
                end={END}
            />
        );
        const squares = cells(container);
        // The grid opens on the Monday of the week holding 1 January, so its
        // first square is still 2025 — and its last is already 2027.
        for (const square of [squares[0], squares.at(-1)!]) {
            expect(square.getAttribute('title')).toBeNull();
            expect(square.className).not.toContain('bg-');
        }
        expect(screen.getByTitle('Rest · January 1')).toBeInTheDocument();
    });

    it('draws the months still to come, with nothing to say about them', () => {
        const { container } = renderWithLocale(
            <TrainingYear
                days={{}}
                end={END}
            />
        );
        // 31 December is drawn, and every square between it and today: only
        // the six days of 2027 in the last column are left out.
        const drawn = cells(container).filter((square) =>
            square.className.includes('bg-')
        );
        expect(drawn).toHaveLength(365);
        expect(
            screen.queryByTitle('Rest · September 10')
        ).not.toBeInTheDocument();
        expect(
            screen.queryByTitle('Rest · December 31')
        ).not.toBeInTheDocument();
    });
});
