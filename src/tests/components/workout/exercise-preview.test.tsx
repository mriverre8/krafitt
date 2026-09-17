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

    // Every working set opens on the tag that says which one it is, whether or
    // not it has a technique to put beside it. A drop is named by what it does
    // instead — that is the whole of what distinguishes it from the set above.
    it('tags every working set, and names a drop by what it does', () => {
        render(<ExercisePreview exercise={exercise} />);
        expect(screen.getByText('Set 1')).toBeInTheDocument();
        expect(screen.getByText('Set 2')).toBeInTheDocument();
        expect(screen.getByText('Drop set −30%')).toBeInTheDocument();
    });

    // Tag and technique are separate marks on one line, not one string: the tag
    // says which set, the technique what kind.
    it('puts the technique beside the tag, not in place of it', () => {
        render(<ExercisePreview exercise={exercise} />);
        const tag = screen.getByText('Set 1');
        expect(tag.parentElement).toHaveTextContent('Set 1Top set');
        // Set 2 has none, so its line stops at the tag.
        expect(screen.getByText('Set 2').parentElement).toHaveTextContent(
            'Set 2'
        );
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
