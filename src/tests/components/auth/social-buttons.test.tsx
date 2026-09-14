import { SocialButtons } from '@/components/auth/social-buttons';
import { SOCIAL_PROVIDERS } from '@/lib/social-providers';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithLocale } from '../../setup-helpers';

const signInSocial = vi.fn();
vi.mock('@/lib/auth-client', () => ({
    authClient: {
        signIn: { social: (...args: unknown[]) => signInSocial(...args) },
    },
}));

const marks = () => [...document.querySelectorAll('img')];

beforeEach(() => {
    signInSocial.mockReset();
    signInSocial.mockResolvedValue({ error: null });
});

describe('SocialButtons', () => {
    it('offers one button per provider', () => {
        render(<SocialButtons onError={() => {}} />);
        expect(
            screen.getByRole('button', { name: 'Continue with Google' })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Continue with GitHub' })
        ).toBeInTheDocument();
    });

    // The marks are the providers' own files, shipped as they came rather than
    // redrawn: this fails the moment one is renamed or dropped from public/.
    it('draws each provider with its own asset', () => {
        render(<SocialButtons onError={() => {}} />);
        const sources = marks().map((img) => img.getAttribute('src'));
        for (const { mark, markDark } of SOCIAL_PROVIDERS) {
            expect(sources).toContain(mark);
            if (markDark) expect(sources).toContain(markDark);
        }
    });

    // A single-colour mark needs one file per theme or it vanishes into the
    // button behind it. CSS picks, so both are in the tree and exactly one of
    // the pair is showing in either theme — never both, never neither.
    it('ships both GitHub marks and lets the theme choose', () => {
        render(<SocialButtons onError={() => {}} />);
        const github = screen.getByRole('button', {
            name: 'Continue with GitHub',
        });
        const [light, dark] = [...github.querySelectorAll('img')];

        expect(light).toHaveClass('dark:hidden');
        expect(dark).toHaveClass('hidden', 'dark:block');
    });

    // Google's four-colour G carries its own contrast, so a second copy would
    // be a hidden image on every render for nothing.
    it('gives Google the one mark that reads on both themes', () => {
        render(<SocialButtons onError={() => {}} />);
        const google = screen.getByRole('button', {
            name: 'Continue with Google',
        });
        expect(google.querySelectorAll('img')).toHaveLength(1);
    });

    // The button beside each mark already names the provider, so the mark
    // itself must not be read out a second time.
    it('keeps the marks out of the accessible name', () => {
        render(<SocialButtons onError={() => {}} />);
        for (const img of marks()) {
            expect(img).toHaveAttribute('alt', '');
            expect(img).toHaveAttribute('aria-hidden');
        }
    });

    it('sends you to the provider, and back here when it is done', () => {
        render(<SocialButtons onError={() => {}} />);
        fireEvent.click(
            screen.getByRole('button', { name: 'Continue with GitHub' })
        );
        expect(signInSocial).toHaveBeenCalledWith({
            provider: 'github',
            callbackURL: '/',
        });
    });

    // On success the browser leaves for the provider, so only the failure path
    // ever gets back here — and it has to say so rather than sit there dead.
    it('reports a refusal and frees the buttons again', async () => {
        signInSocial.mockResolvedValue({ error: { message: 'Nope' } });
        const onError = vi.fn();
        render(<SocialButtons onError={onError} />);

        fireEvent.click(
            screen.getByRole('button', { name: 'Continue with Google' })
        );
        await waitFor(() => expect(onError).toHaveBeenCalledWith('Nope'));
        expect(
            screen.getByRole('button', { name: 'Continue with Google' })
        ).toBeEnabled();
    });

    it('holds every button down while one is in flight', () => {
        signInSocial.mockReturnValue(new Promise(() => {}));
        render(<SocialButtons onError={() => {}} />);

        fireEvent.click(
            screen.getByRole('button', { name: 'Continue with Google' })
        );
        expect(
            screen.getByRole('button', { name: 'Continue with GitHub' })
        ).toBeDisabled();
    });

    it('translates the offer', () => {
        renderWithLocale(<SocialButtons onError={() => {}} />, 'es');
        expect(
            screen.getByRole('button', { name: 'Continuar con Google' })
        ).toBeInTheDocument();
    });
});
