export {};

interface ThumbnailJob {
    fileBytes: ArrayBuffer;
    maxPixelSize: number;
}

interface ThumbnailResult {
    buffer: ArrayBuffer;
}

/**
 * Web Worker message handler.
 * Receives original image bytes, scales the image using OffscreenCanvas,
 * and returns a WebP-encoded thumbnail.
 */
self.onmessage = async (e: MessageEvent<ThumbnailJob>) => {
    const { fileBytes, maxPixelSize } = e.data;

    try {
        const blob = new Blob([fileBytes]);
        const bitmap = await createImageBitmap(blob);

        const scale = maxPixelSize / Math.min(bitmap.width, bitmap.height);
        const w = bitmap.width * scale;
        const h = bitmap.height * scale;

        const canvas = new OffscreenCanvas(w, h);
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            throw new Error("Failed to get 2D rendering context");
        }

        ctx.drawImage(bitmap, 0, 0, w, h);

        const outBlob = await canvas.convertToBlob({
            type: "image/webp",
            quality: 0.85,
        });

        if (!outBlob) {
            throw new Error("convertToBlob returned null");
        }

        const buffer = await outBlob.arrayBuffer();

        const result: ThumbnailResult = { buffer };

        // Transfer the ArrayBuffer back to main thread
        postMessage(result, [buffer]);

    } catch (err) {
        console.error("Worker thumbnail generation error:", err);
        postMessage({ error: String(err) });
    }
};
