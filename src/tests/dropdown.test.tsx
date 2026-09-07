import { Dropdown } from '@/components/dropdown';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

function renderDropdown() {
    return render(
        <div>
            <span>outside</span>
            <Dropdown
                label="Menu"
                icon={<span>icon</span>}
            >
                {(close) => (
                    <button
                        type="button"
                        onClick={close}
                    >
                        item
                    </button>
                )}
            </Dropdown>
        </div>
    );
}

const trigger = () => screen.getByRole('button', { name: 'Menu' });

describe('Dropdown', () => {
    it('stays closed until the trigger is clicked', () => {
        renderDropdown();
        expect(screen.queryByText('item')).not.toBeInTheDocument();
        expect(trigger()).toHaveAttribute('aria-expanded', 'false');

        fireEvent.click(trigger());
        expect(screen.getByText('item')).toBeInTheDocument();
        expect(trigger()).toHaveAttribute('aria-expanded', 'true');
    });

    it('closes on a second click of the trigger', () => {
        renderDropdown();
        fireEvent.click(trigger());
        fireEvent.click(trigger());
        expect(screen.queryByText('item')).not.toBeInTheDocument();
    });

    it('closes when clicking outside', () => {
        renderDropdown();
        fireEvent.click(trigger());
        fireEvent.mouseDown(screen.getByText('outside'));
        expect(screen.queryByText('item')).not.toBeInTheDocument();
    });

    it('closes on Escape', () => {
        renderDropdown();
        fireEvent.click(trigger());
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByText('item')).not.toBeInTheDocument();
    });

    it('lets an item close the menu', () => {
        renderDropdown();
        fireEvent.click(trigger());
        fireEvent.click(screen.getByText('item'));
        expect(screen.queryByText('item')).not.toBeInTheDocument();
    });
});
