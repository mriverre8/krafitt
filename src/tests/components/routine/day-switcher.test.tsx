import { DaySwitcher } from '@/components/routine/day-switcher';
import { EditModeContext, noDirtyDays } from '@/lib/edit-mode';
import type { DayTab } from '@/lib/types';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const days: DayTab[] = [
    { id: 'w1', name: 'Push A', ready: true, unsaved: false },
    { id: 'w2', name: 'Pull A', ready: false, unsaved: false },
    { id: 'w3', name: 'Legs', ready: true, unsaved: true },
];

function renderRack(index = 0, editing = false) {
    const onSelect = vi.fn();
    render(
        <EditModeContext.Provider
            value={{
                editing,
                toggle: () => {},
                discarded: 0,
                dirtyDays: noDirtyDays,
                setDirty: () => {},
            }}
        >
            <DaySwitcher
                days={days}
                index={index}
                baseId="days"
                onSelect={onSelect}
            />
        </EditModeContext.Provider>
    );
    return onSelect;
}

const tabs = () => screen.getAllByRole('tab');

describe('DaySwitcher', () => {
    // Numbers only: the day's name is the heading right below the rack.
    it('is one numbered plate per day, wired to its panel', () => {
        renderRack(1);
        expect(tabs().map((tab) => tab.textContent)).toEqual(['1', '2', '3']);
        expect(tabs()[1]).toHaveAttribute('aria-selected', 'true');
        expect(tabs()[1]).toHaveAttribute('aria-controls', 'days-panel-1');
        expect(
            screen.getByRole('tablist', { name: 'Workouts' })
        ).toBeInTheDocument();
    });

    it('selects the plate that was clicked', () => {
        const onSelect = renderRack(0);
        fireEvent.click(tabs()[2]);
        expect(onSelect).toHaveBeenCalledWith(2);
    });

    it('steps with the arrows, and stops at both ends', () => {
        const onSelect = renderRack(0);
        expect(
            screen.getByRole('button', { name: 'Previous day' })
        ).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: 'Next day' }));
        expect(onSelect).toHaveBeenCalledWith(1);
    });

    it('disables the forward arrow on the last day', () => {
        renderRack(2);
        expect(screen.getByRole('button', { name: 'Next day' })).toBeDisabled();
        expect(
            screen.getByRole('button', { name: 'Previous day' })
        ).toBeEnabled();
    });

    it('walks the rack from the keyboard', () => {
        const onSelect = renderRack(1);
        const list = screen.getByRole('tablist');

        fireEvent.keyDown(list, { key: 'ArrowRight' });
        fireEvent.keyDown(list, { key: 'ArrowLeft' });
        fireEvent.keyDown(list, { key: 'Home' });
        fireEvent.keyDown(list, { key: 'End' });
        expect(onSelect.mock.calls.flat()).toEqual([2, 0, 0, 2]);
    });

    it('ignores a key that would walk off the rack', () => {
        const onSelect = renderRack(0);
        fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' });
        expect(onSelect).not.toHaveBeenCalled();
    });

    // Roving tabindex: Tab reaches the rack, then the arrows move inside it.
    it('is a single tab stop', () => {
        renderRack(1);
        expect(tabs().map((tab) => tab.getAttribute('tabindex'))).toEqual([
            '-1',
            '0',
            '-1',
        ]);
    });

    // Colour is never the only carrier, and the verdict is on a draft — reading
    // a routine there is no draft to judge.
    it('judges no day until the routine is being edited', () => {
        renderRack(0);
        expect(tabs()[1]).toHaveAccessibleName('Day 2, Pull A');
        expect(tabs()[2]).toHaveAccessibleName('Day 3, Legs');
    });

    it('marks unsaved and incomplete days while editing', () => {
        renderRack(0, true);
        expect(tabs()[0]).toHaveAccessibleName('Day 1, Push A');
        expect(tabs()[1]).toHaveAccessibleName('Day 2, Pull A, Incomplete');
        expect(tabs()[2]).toHaveAccessibleName('Day 3, Legs, unsaved changes');
    });
});
