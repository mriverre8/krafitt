import { ExercisePreview } from '@/components/workout/exercise-preview';
import type { ExerciseView } from '@/components/workout/workout-exercise';
import { cleanup, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const exercise: ExerciseView = {
    id: 'e1',
    name: 'Bench press',
    sets: [
        { repMode: 'range', repMin: 4, repMax: 6, technique: 'Top set' },
        { repMode: 'range', repMin: 8, repMax: 10, technique: null },
        {
            repMode: 'amrap',
            repMin: null,
            repMax: null,
            technique: null,
            kind: 'drop',
            value: 30,
        },
    ],
};

describe('ExercisePreview', () => {
    it('reads the plan as text, with nothing to type in', () => {
        const { container } = render(<ExercisePreview exercise={exercise} />);
        expect(screen.getByText('Bench press')).toBeInTheDocument();
        expect(screen.getByText('Top set')).toBeInTheDocument();
        expect(screen.getByText('4-6 reps')).toBeInTheDocument();
        expect(container.querySelector('input, select, button')).toBeNull();
    });

    // Same rule as the day's own list: a set with no technique goes by its
    // number, and a drop carries the cut it asks for.
    it('names a set with no technique by its number', () => {
        render(<ExercisePreview exercise={exercise} />);
        expect(screen.getByText('Set 2')).toBeInTheDocument();
        expect(screen.getByText('Drop set −30%')).toBeInTheDocument();
    });

    // The pause is what a rest-pause set is for, so a missing one is named.
    // A drop with no per cent is not: unsized, it still trains.
    it('names a rest-pause that was never given its seconds', () => {
        cleanup();
        render(
            <ExercisePreview
                exercise={{
                    id: 'e2',
                    name: 'Squat',
                    sets: [
                        {
                            repMode: 'fixed',
                            repMin: 5,
                            repMax: null,
                            technique: null,
                        },
                        {
                            repMode: 'amrap',
                            repMin: null,
                            repMax: null,
                            technique: null,
                            kind: 'rest',
                            value: null,
                        },
                        {
                            repMode: 'amrap',
                            repMin: null,
                            repMax: null,
                            technique: null,
                            kind: 'drop',
                            value: null,
                        },
                    ],
                }}
            />
        );
        expect(screen.getByText('Rest-pause set')).toBeInTheDocument();
        expect(screen.getByText('· Seconds to define')).toBeInTheDocument();
        // The drop is left alone: unsized, it still trains.
        expect(screen.getByText('Drop set')).toBeInTheDocument();
        expect(screen.getAllByText(/Seconds to define/)).toHaveLength(1);
    });

    // A drop that was never sized still reads: it is the per cent that is
    // missing, not the set.
    it('says so when a set is not filled in yet', () => {
        cleanup();
        render(
            <ExercisePreview
                exercise={{
                    id: 'e2',
                    name: '',
                    sets: [
                        {
                            repMode: 'range',
                            repMin: null,
                            repMax: null,
                            technique: null,
                        },
                    ],
                }}
            />
        );
        expect(screen.getByText('Exercise')).toBeInTheDocument();
        expect(screen.getByText('Reps to define')).toBeInTheDocument();
    });
});
