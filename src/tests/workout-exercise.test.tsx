import {
    WorkoutExercise,
    type ExerciseView,
} from '@/components/workout-exercise';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const exercise: ExerciseView = {
    id: 'e1',
    name: 'Bench press',
    sets: [
        { repMode: 'range', repMin: 4, repMax: 6, technique: 'Top set' },
        { repMode: 'range', repMin: 8, repMax: 10, technique: 'Back off' },
        { repMode: 'range', repMin: 8, repMax: 10, technique: 'Back off' },
    ],
};

const base = {
    exercise,
    logs: {},
    previous: {},
    previousWeek: null,
    isSetEnabled: () => false,
    onSaveSet: () => {},
};

describe('WorkoutExercise', () => {
    it('gives every set its own prescription', () => {
        render(<WorkoutExercise {...base} />);
        expect(screen.getByText('Bench press')).toBeInTheDocument();
        expect(screen.getByText(/4-6 reps/)).toBeInTheDocument();
        expect(screen.getByText('Top set ·')).toBeInTheDocument();
        expect(screen.getAllByText('Back off ·')).toHaveLength(2);
    });

    it('renders one row per set', () => {
        render(<WorkoutExercise {...base} />);
        expect(screen.getAllByLabelText(/^Weight set/)).toHaveLength(3);
    });

    it('reports which set was saved', () => {
        const onSaveSet = vi.fn();
        render(
            <WorkoutExercise
                {...base}
                isSetEnabled={() => true}
                onSaveSet={onSaveSet}
            />
        );
        fireEvent.change(screen.getByLabelText('Weight set 2'), {
            target: { value: '80' },
        });
        fireEvent.change(screen.getByLabelText('Reps set 2'), {
            target: { value: '8' },
        });
        fireEvent.click(screen.getByLabelText('Save set 2'));
        expect(onSaveSet).toHaveBeenCalledWith(1, 80, 8);
    });
});
