import { EmptyState } from '@/components/ui/empty-state';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('EmptyState', () => {
    it('shows the message and points at the routines screen', () => {
        render(
            <EmptyState
                title="No active routine"
                body="Create one first."
            />
        );
        expect(
            screen.getByRole('heading', { name: 'No active routine' })
        ).toBeInTheDocument();
        expect(
            screen.getByRole('link', { name: 'Go to my routines' })
        ).toHaveAttribute('href', '/routines');
    });
});
