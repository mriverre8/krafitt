import { swap } from '@/lib/swap';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** Stood in for by hand: jsdom has none, and only `finished` is read. */
const doc = document as unknown as { startViewTransition?: unknown };

afterEach(() => {
    delete doc.startViewTransition;
    vi.unstubAllGlobals();
});

describe('swap', () => {
    // jsdom has no view transitions, like any browser without them.
    it('just runs the move where there are no view transitions', async () => {
        const update = vi.fn();
        await swap(update);
        expect(update).toHaveBeenCalledOnce();
        expect(document.documentElement.dataset.swap).toBeUndefined();
    });

    it('just runs it for a visitor who asked for less motion', async () => {
        const start = vi.fn();
        doc.startViewTransition = start;
        vi.stubGlobal('matchMedia', () => ({ matches: true }));
        const update = vi.fn();
        await swap(update);
        expect(update).toHaveBeenCalledOnce();
        expect(start).not.toHaveBeenCalled();
    });

    // While the rows slide the page around them is marked, so globals.css can
    // show its new picture at once; the mark goes when the slide is over.
    it('slides it otherwise, marking the page until the slide is done', async () => {
        let done!: () => void;
        const finished = new Promise<void>((resolve) => (done = resolve));
        doc.startViewTransition = vi.fn((update: () => void) => {
            update();
            return { finished };
        });
        vi.stubGlobal('matchMedia', () => ({ matches: false }));
        const update = vi.fn();

        const over = swap(update);
        expect(update).toHaveBeenCalledOnce();
        expect(document.documentElement.dataset.swap).toBe('');

        done();
        await over;
        expect(document.documentElement.dataset.swap).toBeUndefined();
    });
});
