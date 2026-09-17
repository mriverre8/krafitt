import { EditorSpecs } from '@/components/landing/editor-specs';
import { EXERCISES, SETS, WEEKS } from '@/lib/constants';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithLocale } from './setup-helpers';

describe('EditorSpecs', () => {
    // The limits quoted here are the ones the server actually enforces. This is
    // the test that fails if someone raises a limit in lib/constants.ts and
    // forgets the page.
    it('quotes the editor limits the app really enforces', () => {
        render(<EditorSpecs />);

        for (const [n, title] of [
            [WEEKS.max, `From 1 to ${WEEKS.max} weeks`],
            [EXERCISES.max, `Up to ${EXERCISES.max} exercises a day`],
            [SETS.max, `Up to ${SETS.max} sets an exercise`],
        ] as const) {
            expect(
                screen.getByRole('heading', { name: title })
            ).toBeInTheDocument();
            expect(screen.getByText(String(n))).toBeInTheDocument();
        }
    });

    // The chips are worded from the app's own dictionary, so they cannot
    // advertise a prescription the editor would not write.
    it('lists what a set can be prescribed as', () => {
        render(<EditorSpecs />);

        for (const chip of [
            '8-10 reps',
            '10 reps',
            'AMRAP',
            'Top set',
            'Back off',
            'Warm-up set',
            'Straight sets',
            'Drop set −20%',
            'Rest-pause set 15s',
        ]) {
            expect(screen.getByText(chip)).toBeInTheDocument();
        }
    });

    it('translates', () => {
        renderWithLocale(<EditorSpecs />, 'es');
        expect(screen.getByText('AMRAP')).toBeInTheDocument();
        expect(
            screen.getByRole('heading', { name: `De 1 a ${WEEKS.max} semanas` })
        ).toBeInTheDocument();
    });
});
