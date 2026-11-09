import { AuthForms } from '@/components/auth/auth-forms';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const signIn = vi.fn().mockResolvedValue({ error: null });
const signUp = vi.fn().mockResolvedValue({ error: null });

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/lib/auth-client', () => ({
    authClient: {
        signIn: { email: (...args: unknown[]) => signIn(...args) },
        signUp: { email: (...args: unknown[]) => signUp(...args) },
    },
}));

describe('AuthForms', () => {
    it('starts on sign in, without a name field', () => {
        render(<AuthForms />);
        expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    });

    it('asks for a name when signing up', () => {
        render(<AuthForms />);
        fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
    });

    // The same cap Settings enforces later: a name that signs up too long
    // could never be saved again from there.
    it('caps the signup name at the length an account allows', async () => {
        const { USER_NAME_MAX } = await import('@/lib/constants');
        render(<AuthForms />);
        fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
        expect(screen.getByLabelText('Name')).toHaveAttribute(
            'maxlength',
            String(USER_NAME_MAX)
        );
    });

    // type="email" would accept `asdf@asdf`; the pattern is what asks for a TLD.
    it('demands a TLD on the email', async () => {
        const { EMAIL_PATTERN } = await import('@/lib/constants');
        render(<AuthForms />);
        expect(screen.getByLabelText('Email')).toHaveAttribute(
            'pattern',
            EMAIL_PATTERN
        );

        // Anchored the way the browser anchors the attribute.
        const pattern = new RegExp(`^(?:${EMAIL_PATTERN})$`);
        expect(pattern.test('ana@gmail.com')).toBe(true);
        expect(pattern.test('ana.lopez+gym@sub.dominio.es')).toBe(true);
        expect(pattern.test('a@b.co')).toBe(true);
        expect(pattern.test('asdf@asdf')).toBe(false);
        expect(pattern.test('ana@gmail.c')).toBe(false);
        expect(pattern.test('ana@gmail.123')).toBe(false);
    });

    it('signs in with the typed credentials', async () => {
        render(<AuthForms />);
        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'a@b.com' },
        });
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'password123' },
        });
        fireEvent.click(screen.getByRole('button', { name: "Let's go" }));
        await waitFor(() =>
            expect(signIn).toHaveBeenCalledWith({
                email: 'a@b.com',
                password: 'password123',
            })
        );
    });

    it('surfaces the error the server returned', async () => {
        signIn.mockResolvedValueOnce({
            error: { message: 'Invalid email or password' },
        });
        render(<AuthForms />);
        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'a@b.com' },
        });
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'wrongpass' },
        });
        fireEvent.click(screen.getByRole('button', { name: "Let's go" }));
        expect(await screen.findByRole('alert')).toHaveTextContent(
            'Invalid email or password'
        );
    });
});
