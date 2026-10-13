import { ExerciseStats } from '@/components/history/exercise-stats';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const exercise = {
    id: 'e1',
    name: 'Bench press',
    sets: [{ repMode: 'range' }],
};

const week = (weight: number, reps: number) => ({
    e1: { 0: { weight, reps } },
});

describe('ExerciseStats', () => {
    it('shows the best set, the estimated max and the change in volume', () => {
        render(
            <ExerciseStats
                exercise={exercise}
                weeks={{ 1: week(100, 5), 2: week(110, 5) }}
            />
        );
        expect(screen.getByText('110×5')).toBeInTheDocument();
        expect(screen.getByText('+10% since week one')).toBeInTheDocument();
        expect(screen.getByText('+50 kg (+10%)')).toBeInTheDocument();
        expect(screen.getByText('500 kg')).toBeInTheDocument();
        expect(screen.getByText('550 kg')).toBeInTheDocument();
        expect(screen.queryByText(/Stalled/)).not.toBeInTheDocument();
    });

    it('flags an exercise that has not moved in three weeks', () => {
        render(
            <ExerciseStats
                exercise={exercise}
                weeks={{
                    1: week(100, 5),
                    2: week(100, 5),
                    3: week(100, 4),
                    4: week(100, 4),
                }}
            />
        );
        expect(screen.getByText('Stalled · 3 weeks')).toBeInTheDocument();
    });

    // Week 2 stopped after the first set: it is no yardstick, so week 3 is
    // measured against week 1.
    it('measures this week against the last one done in full', () => {
        const two = { ...exercise, sets: [...exercise.sets, ...exercise.sets] };
        const full = {
            e1: { 0: { weight: 100, reps: 5 }, 1: { weight: 100, reps: 5 } },
        };
        render(
            <ExerciseStats
                exercise={two}
                weeks={{ 1: full, 2: week(100, 5), 3: full }}
            />
        );
        expect(screen.queryByText('Week 2')).not.toBeInTheDocument();
        expect(screen.getByText('Week 1')).toBeInTheDocument();
        expect(screen.getByText('0 kg (0%)')).toBeInTheDocument();
    });

    // Week 3 is still half-done: the comparison stays on weeks 1 and 2.
    it('leaves a half-done latest week out of the comparison', () => {
        const two = { ...exercise, sets: [...exercise.sets, ...exercise.sets] };
        const full = (reps: number) => ({
            e1: { 0: { weight: 100, reps }, 1: { weight: 100, reps } },
        });
        render(
            <ExerciseStats
                exercise={two}
                weeks={{ 1: full(5), 2: full(6), 3: week(100, 6) }}
            />
        );
        expect(screen.getByText('+200 kg (+20%)')).toBeInTheDocument();
        expect(screen.getByText('1,200 kg')).toBeInTheDocument();
        expect(screen.queryByText('600 kg')).not.toBeInTheDocument();
    });

    it('draws nothing before anything is logged', () => {
        const { container } = render(
            <ExerciseStats
                exercise={exercise}
                weeks={{}}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });
});
