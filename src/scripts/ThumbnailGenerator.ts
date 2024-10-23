import simpleSvgPlaceholder from "@cloudfour/simple-svg-placeholder";

/**
 * Returns a place holder image
 * Retrieves a thumbnail for the given image path and target size. If a cached thumbnail already exists, it returns the cached version.
 * Otherwise, it generates a new thumbnail in the background and returns the original full-resolution image immediately.
 *
 * This method is used to display high-resolution images at smaller sizes, which helps avoid performance issues by loading scaled-down versions (thumbnails), thus reducing lag caused by loading full-resolution images.
 *
 * @param {string} imgPath - The path to the original high-resolution image.
 * @param {number} maxPixelSize - The maximum pixel size for the longest side of the thumbnail (either width or height), to which the image will be scaled down to while maintaining its aspect ratio.
 * @param {boolean} imgPathIsAbsolute - Indicates whether the provided `imgPath` is an absolute path. If false, the path will be resolved relative to Takma's save directory.
 * @returns {Promise<string>} - A promise that resolves to the URL of the thumbnail or the full-resolution image if not cached.
 */
export function getThumbnail(imgPath: string, maxPixelSize: number = 0, imgPathIsAbsolute: boolean = false): string
{
    const filenameWithoutUUID = imgPath.getFilename().substring(36);

    return simpleSvgPlaceholder({
        text: filenameWithoutUUID,
    });
}
