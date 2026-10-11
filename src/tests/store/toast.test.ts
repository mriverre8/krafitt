import { TOAST_MS, toast, useToastStore } from '@/store/toast';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('toast', () => {
    afterEach(() => vi.useRealTimers());

    it('raises a toast and takes it down on its own', () => {
        vi.useFakeTimers();
        toast('Saved');
        toast('Failed', 'error');
        expect(useToastStore.getState().toasts).toMatchObject([
            { message: 'Saved', kind: 'success' },
            { message: 'Failed', kind: 'error' },
        ]);

        vi.advanceTimersByTime(TOAST_MS);
        expect(useToastStore.getState().toasts).toEqual([]);
    });
});
