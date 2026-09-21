import { MemberRoleSelect } from '@/components/routine/member-role-select';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithLocale } from '@/tests/setup-helpers';

const setup = (role = 'coach') => {
    const setRole = vi.fn(async () => {});
    renderWithLocale(
        <MemberRoleSelect
            name="Ada"
            role={role}
            setRole={setRole}
        />
    );
    return {
        setRole,
        select: screen.getByRole('combobox', { name: 'Role of Ada' }),
    };
};

describe('MemberRoleSelect', () => {
    // Labels carry the name because the page holds one of these per person.
    it('offers only the roles that can be given away', () => {
        const { select } = setup();

        expect(
            [...select.querySelectorAll('option')].map((o) => o.value)
        ).toEqual(['coach', 'scout']);
        expect(
            screen.getByRole('option', { name: 'Coach' })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('option', { name: 'Scout' })
        ).toBeInTheDocument();
    });

    it('shows the role the person already holds', () => {
        expect(setup('scout').select).toHaveValue('scout');
    });

    it('writes the role that was picked', async () => {
        const { setRole, select } = setup();

        fireEvent.change(select, { target: { value: 'scout' } });

        await waitFor(() => expect(setRole).toHaveBeenCalledWith('scout'));
    });

    // Controlled on purpose: what is on screen is what the server holds, and
    // the control stands down until the write it just sent comes back.
    it('locks while the write is in flight', async () => {
        const { select } = setup();

        fireEvent.change(select, { target: { value: 'scout' } });

        await waitFor(() => expect(select).toBeDisabled());
    });
});
