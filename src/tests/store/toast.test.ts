import { toast, useToastStore } from '@/store/toast';
import { describe, expect, it } from 'vitest';

const toasts = () => useToastStore.getState().toasts;

describe('toast', () => {
    it('raises a toast of either kind', () => {
        toast('Saved');
        toast('Failed', 'error');
        expect(toasts()).toMatchObject([
            { message: 'Saved', kind: 'success' },
            { message: 'Failed', kind: 'error' },
        ]);
    });

    // Dismissing only starts the way out: the host takes it off once its exit
    // has played.
    it('marks a dismissed toast as leaving, and drops it once removed', () => {
        toast('Saved');
        const [{ id }] = toasts();

        useToastStore.getState().dismiss(id);
        expect(toasts()).toMatchObject([{ id, leaving: true }]);

        useToastStore.getState().remove(id);
        expect(toasts()).toEqual([]);
    });
});
