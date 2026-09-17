import { Landing } from '@/components/landing/landing';
import { WEEKS } from '@/lib/constants';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithLocale } from '@/tests/setup-helpers';

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

    // The sections themselves are covered by their own suites; what matters
    // here is that the page really mounts them.
    it('mounts the app previews and the editor spec', () => {
        render(<Landing />);

        expect(screen.getByText('2/4 sets')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Next exercise' })
        ).toBeInTheDocument();
        expect(
            within(document.getElementById('editor')!).getByRole('heading', {
                name: `From 1 to ${WEEKS.max} weeks`,
            })
        ).toBeInTheDocument();
    });
});
