// Avatars are stored as a base64 data URL on the user row, not as a file: the
// app has no upload endpoint and no bucket, and a 400px JPEG at 0.7 is small
// enough (~30KB) that a text column is the cheaper answer than either.

export const MAX_IMAGE_DIMENSION = 400;
export const IMAGE_QUALITY = 0.7;

/**
 * Reads an image file, resizes it so it fits within the given bounds keeping
 * the aspect ratio, and returns it as a base64 JPEG data URL.
 */
export const compressImageToBase64 = (
    file: File,
    maxWidth: number = MAX_IMAGE_DIMENSION,
    maxHeight: number = MAX_IMAGE_DIMENSION,
    quality: number = IMAGE_QUALITY
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onerror = () => reject(new Error('Could not read image file'));

        reader.onload = (e) => {
            const img = new window.Image();

            img.onerror = () => reject(new Error('Could not load image file'));

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);

                resolve(canvas.toDataURL('image/jpeg', quality));
            };

            img.src = e.target?.result as string;
        };

        reader.readAsDataURL(file);
    });
};
