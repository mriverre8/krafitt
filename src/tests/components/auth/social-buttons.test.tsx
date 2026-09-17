import { SocialButtons } from '@/components/auth/social-buttons';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithLocale } from '@/tests/setup-helpers';

const social = vi.fn();

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        signIn: { social: (...args: unknown[]) => social(...args) },
    },
}));

beforeEach(() => {
    social.mockReset().mockResolvedValue({ error: null });
});

const google = () =>
    screen.getByRole('button', { name: 'Continue with Google' });
const github = () =>
    screen.getByRole('button', { name: 'Continue with GitHub' });

describe('SocialButtons', () => {
    it('offers one button per provider', () => {
        render(<SocialButtons onError={vi.fn()} />);
        expect(google()).toBeInTheDocument();
        expect(github()).toBeInTheDocument();
    });

    // The provider hands the browser back to us, and where it lands is the
    // app root — never the sign-in page the user just left.
    it('signs in with the provider that was clicked', () => {
        render(<SocialButtons onError={vi.fn()} />);
        fireEvent.click(github());
        expect(social).toHaveBeenCalledWith({
            provider: 'github',
            callbackURL: '/',
        });
    });

    // A stale error from the previous attempt would read as if this one had
    // already failed, so it goes before the call, not after it.
    it('clears the standing error when a new attempt starts', () => {
        const onError = vi.fn();
        render(<SocialButtons onError={onError} />);
        fireEvent.click(google());
        expect(onError).toHaveBeenCalledWith(undefined);
    });

    it("reports the provider's own message when it fails", async () => {
        social.mockResolvedValue({ error: { message: 'Account disabled' } });
        const onError = vi.fn();
        render(<SocialButtons onError={onError} />);
        fireEvent.click(google());

        await waitFor(() =>
            expect(onError).toHaveBeenLastCalledWith('Account disabled')
        );
    });

    it('falls back to a generic message when the failure has none', async () => {
        social.mockResolvedValue({ error: {} });
        const onError = vi.fn();
        render(<SocialButtons onError={onError} />);
        fireEvent.click(google());

        await waitFor(() =>
            expect(onError).toHaveBeenLastCalledWith('Could not complete')
        );
    });

    // Two providers at once would race two redirects, so one in flight locks
    // the pair — and unlocks them again if it comes back with an error.
    it('locks both buttons while one is in flight', async () => {
        let finish: (result: { error: null }) => void = () => {};
        social.mockReturnValue(
            new Promise<{ error: null }>((resolve) => {
                finish = resolve;
            })
        );
        render(<SocialButtons onError={vi.fn()} />);
        fireEvent.click(google());

        expect(google()).toBeDisabled();
        expect(github()).toBeDisabled();

        finish({ error: null });
        await waitFor(() => expect(github()).toBeEnabled());
    });

    it('translates', () => {
        renderWithLocale(<SocialButtons onError={vi.fn()} />, 'es');
        expect(
            screen.getByRole('button', { name: 'Continuar con Google' })
        ).toBeInTheDocument();
        expect(screen.getByText('o')).toBeInTheDocument();
    });
});
