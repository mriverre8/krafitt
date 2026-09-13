import { compressImageToBase64, IMAGE_QUALITY } from '@/lib/image';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// jsdom ships no canvas and never fires an <img> load, so both are faked. What
// is under test is the arithmetic between them: the box the picture is drawn
// into. toDataURL reports that box back so the assertions can read it.
let natural = { width: 0, height: 0 };
let fails = false;
const toDataURL = vi.fn(function (this: HTMLCanvasElement) {
    return `${this.width}x${this.height}`;
});

class FakeImage {
    onload: () => void = () => {};
    onerror: () => void = () => {};
    width = 0;
    height = 0;
    set src(_value: string) {
        this.width = natural.width;
        this.height = natural.height;
        queueMicrotask(() => (fails ? this.onerror() : this.onload()));
    }
}

beforeEach(() => {
    fails = false;
    vi.stubGlobal('Image', FakeImage);
    HTMLCanvasElement.prototype.getContext = (() => ({
        drawImage: () => {},
    })) as unknown as HTMLCanvasElement['getContext'];
    HTMLCanvasElement.prototype.toDataURL = toDataURL;
});
afterEach(() => vi.unstubAllGlobals());

const jpeg = () => new File(['x'], 'photo.jpg', { type: 'image/jpeg' });

const compress = (width: number, height: number) => {
    natural = { width, height };
    return compressImageToBase64(jpeg());
};

describe('compressImageToBase64', () => {
    it('caps the long side of a landscape picture, keeping the ratio', async () => {
        await expect(compress(1000, 500)).resolves.toBe('400x200');
    });

    it('caps the long side of a portrait picture, keeping the ratio', async () => {
        await expect(compress(500, 1000)).resolves.toBe('200x400');
    });

    it('caps a square picture on both sides', async () => {
        await expect(compress(800, 800)).resolves.toBe('400x400');
    });

    // Upscaling a small avatar would only add weight, never detail.
    it('leaves a picture already inside the bounds alone', async () => {
        await expect(compress(100, 80)).resolves.toBe('100x80');
    });

    it('takes explicit bounds over the defaults', async () => {
        natural = { width: 1000, height: 500 };
        await expect(compressImageToBase64(jpeg(), 100, 100)).resolves.toBe(
            '100x50'
        );
    });

    it('encodes as JPEG at the shared quality', async () => {
        await compress(100, 100);
        expect(toDataURL).toHaveBeenLastCalledWith('image/jpeg', IMAGE_QUALITY);
    });

    // A .jpg that is not one, a truncated download: the caller shows a message
    // rather than storing whatever the canvas made of it.
    it('rejects when the file is not a picture the browser can load', async () => {
        fails = true;
        await expect(compress(100, 100)).rejects.toThrow(
            'Could not load image file'
        );
    });
});
