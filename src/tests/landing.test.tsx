import { Landing } from '@/components/auth/landing';
import { EXERCISES, SETS, WEEKS } from '@/lib/constants';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithLocale } from './setup-helpers';

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/lib/auth-client', () => ({
    authClient: { signIn: { email: vi.fn() }, signUp: { email: vi.fn() } },
}));

describe('Landing', () => {
    it('explains the app and offers the auth form', () => {
        render(<Landing />);
        expect(screen.getByText(/Build your gym routines/)).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: "Let's go" })
        ).toBeInTheDocument();
    });

    it('translates the pitch', () => {
        renderWithLocale(<Landing />, 'es');
        expect(
            screen.getByText(/Monta tus rutinas de gimnasio/)
        ).toBeInTheDocument();
    });

    it('walks through every screen of the app', () => {
        render(<Landing />);
        for (const title of [
            "Today's workout",
            'Write the plan',
            'Every set, week by week',
            'Write your first routine',
        ]) {
            expect(
                screen.getByRole('heading', { name: title })
            ).toBeInTheDocument();
        }
    });

    // A still of the app mid-session: half the sets banked, and nothing on it
    // that invites a tap it cannot answer.
    it('shows the training screen half finished and locked', () => {
        render(<Landing />);

        expect(screen.getByText('2/4 sets')).toBeInTheDocument();
        expect(screen.getByLabelText('Weight set 1')).toHaveValue(80);
        expect(screen.getByLabelText('Reps set 2')).toHaveValue(9);

        // The sets keep the app's real states — so the third is open and lit
        // rather than greyed — and the whole block is inert instead.
        expect(screen.getByLabelText('Weight set 3')).toBeEnabled();
        expect(
            screen.getByLabelText('Weight set 1').closest('[inert]')
        ).not.toBeNull();
    });

    // The editor is described rather than shown, and the limits it quotes are
    // the ones the server actually enforces. This is the test that fails if
    // someone raises a limit in lib/constants.ts and forgets the page.
    it('quotes the editor limits the app really enforces', () => {
        render(<Landing />);

        expect(
            screen.getByRole('heading', {
                name: `From 1 to ${WEEKS.max} weeks`,
            })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', {
                name: `Up to ${EXERCISES.max} exercises a day`,
            })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('heading', {
                name: `Up to ${SETS.max} sets an exercise`,
            })
        ).toBeInTheDocument();
    });

    // The example chips are worded from the app's own dictionary, so they
    // cannot advertise a prescription the editor would not write. Scoped to
    // the section: the training screen above prescribes its own sets in the
    // very same words, which is the point, and would match twice here.
    it('lists what a set can be prescribed as', () => {
        render(<Landing />);
        const editor = within(document.getElementById('editor')!);
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
            expect(editor.getByText(chip)).toBeInTheDocument();
        }
    });
});
