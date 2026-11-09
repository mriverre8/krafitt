import { TechniqueInput } from '@/components/workout/technique-input';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('TechniqueInput', () => {
    const input = (props: Partial<Parameters<typeof TechniqueInput>[0]> = {}) =>
        render(
            <TechniqueInput
                exerciseNumber={1}
                setLabel="1"
                start=""
                onConfirm={() => {}}
                onCancel={() => {}}
                {...props}
            />
        );
    const box = () => screen.getByLabelText('Exercise 1, technique set 1');
    const confirm = () =>
        screen.getByRole('button', {
            name: 'Exercise 1, confirm technique set 1',
        });

    it('opens on the name it was given, ready to type', () => {
        input({ start: 'Cluster' });
        expect(box()).toHaveValue('Cluster');
        expect(box()).toHaveFocus();
    });

    // A technique has to be called something.
    it('keeps confirm shut on a blank, and trims what it hands over', () => {
        const onConfirm = vi.fn();
        input({ onConfirm });
        expect(confirm()).toBeDisabled();
        fireEvent.change(box(), { target: { value: '   ' } });
        expect(confirm()).toBeDisabled();

        fireEvent.change(box(), { target: { value: '  Cluster ' } });
        fireEvent.click(confirm());
        expect(onConfirm).toHaveBeenCalledWith('Cluster');
    });

    it('confirms on Enter and lets go on Escape or its ×', () => {
        const onConfirm = vi.fn();
        const onCancel = vi.fn();
        input({ start: 'Cluster', onConfirm, onCancel });
        fireEvent.keyDown(box(), { key: 'Enter' });
        expect(onConfirm).toHaveBeenCalledWith('Cluster');

        fireEvent.keyDown(box(), { key: 'Escape' });
        fireEvent.click(
            screen.getByRole('button', {
                name: 'Exercise 1, cancel technique set 1',
            })
        );
        expect(onCancel).toHaveBeenCalledTimes(2);
    });
});
