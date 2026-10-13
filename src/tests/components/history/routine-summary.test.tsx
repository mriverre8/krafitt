import { RoutineSummary } from '@/components/history/routine-summary';
import type { RoutineStats } from '@/lib/stats';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const stats: RoutineStats = {
    done: 2,
    due: 4,
    setsDone: 30,
    setsDue: 40,
    stalled: 3,
    volume: 12340,
    records: 2,
    efforts: { fail: 1, hard: 1, normal: 2, easy: 0 },
    minutes: 55,
};

describe('RoutineSummary', () => {
    it('lays out the routine at a glance', () => {
        render(
            <RoutineSummary
                stats={stats}
                week={2}
                weeks={8}
            />
        );
        // By sets: two days skipped half-done still count their half.
        expect(screen.getByText('75%')).toBeInTheDocument();
        expect(
            screen.getByText('30 of 40 sets · 2 of 4 days in full')
        ).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(
            screen.getByText('Exercises not improving in 3+ weeks')
        ).toBeInTheDocument();
        expect(screen.getByText('2/8')).toBeInTheDocument();
        expect(screen.getByText('12,340 kg')).toBeInTheDocument();
        expect(screen.getByText('55 min')).toBeInTheDocument();
        expect(screen.getByText('How the sets felt')).toBeInTheDocument();
    });

    it('leaves out what there is nothing to say about yet', () => {
        render(
            <RoutineSummary
                stats={{
                    ...stats,
                    done: 0,
                    due: 0,
                    setsDone: 0,
                    setsDue: 0,
                    minutes: null,
                    efforts: { fail: 0, hard: 0, normal: 0, easy: 0 },
                }}
                week={1}
                weeks={null}
            />
        );
        // Adherence and session length have nothing yet, but every tile is
        // still drawn so they stay in pairs.
        expect(screen.getAllByText('—')).toHaveLength(2);
        expect(screen.getByText('Per session')).toBeInTheDocument();
        expect(screen.getAllByRole('term')).toHaveLength(6);
        expect(screen.queryByText('How the sets felt')).not.toBeInTheDocument();
    });
});
