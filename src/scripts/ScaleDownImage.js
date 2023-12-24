/**
 * This method is used to scale down images.
 * We use this method where we display a lot of high-resolution images and display them at a way smaller size than the actual image's dimensions. If we wouldn't scale them down this would cause lag
 * @param {string} srcUrl The URL that points the source image file
 * @param {number} maxPixelSize The maximum dimension (width or height) the image will be scaled down to while maintaining its aspect ratio.
 * @returns {Promise<string>} A Promise that resolves to the data URL of the scaled-down image.
 */
export function scaleDownImage(srcUrl, maxPixelSize)
{
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext('2d')
    if (!ctx)
    {
        console.error('Context not available');
        return Promise.resolve(srcUrl);
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onerror = reject
        img.onload = function() {
            const scaleRatio = maxPixelSize / Math.min(img.width, img.height)
            const w = img.width * scaleRatio
            const h = img.height * scaleRatio
            canvas.width = w
            canvas.height = h
            ctx.drawImage(img, 0, 0, w, h)
            return resolve(canvas.toDataURL("image"));
        }

        img.crossOrigin = "anonymous"; //Enable cross-origin access for external URLs.
        // If we don't do this, the URL we get from `convertFileSrc()` (https://asset.localhost/...) will be seen as an external URL and therefore we won't be allowed to call `canvas.toDataUrl()`. Because that will throw the error "toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported."

        img.src = srcUrl;
    })
}