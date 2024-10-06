import {createDir, exists, writeBinaryFile} from "@tauri-apps/api/fs";
import {convertFileSrc} from "@tauri-apps/api/tauri";
import {SaveLoadManager} from "./SaveLoad/SaveLoadManager";
import {normalize} from "@tauri-apps/api/path";
import {imageExtensions} from "./TakmaDataFolderIO";
import XXH from "xxhashjs";

/**
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
export async function getThumbnail(imgPath: string, maxPixelSize: number, imgPathIsAbsolute: boolean = false): Promise<string>
{
    const hashedImgName: string = XXH.h64(imgPath + maxPixelSize, 0).toString(16); // We include both the `imgPath` and `maxPixelSize` in the hash to handle cases where the same `imgPath` is used in multiple places in the UI with different resolutions. If we only hashed the `imgPath`, we could risk overwriting cached images that were previously generated at different resolutions. By hashing both the image URL and the target size, we ensure that each unique image/size combination has its own cached thumbnail, avoiding conflicts between different resolution variants.

    let absoluteImgPath = imgPathIsAbsolute ? imgPath : await normalize(SaveLoadManager.getSaveDirectoryPath() + imgPath); // Image paths in Takma are stored relative to the save directory. This resolves the relative path to an absolute one.
    let absoluteThumbnailPath = await normalize(await SaveLoadManager.getTempDirectoryPath() + hashedImgName);

    if (await exists(absoluteThumbnailPath))
    {
        return convertFileSrc(absoluteThumbnailPath);
    }
    else
    {
        generateThumbnail(absoluteImgPath, maxPixelSize, absoluteThumbnailPath); // We don't await this function since we want the thumbnail generation to happen in the background, instead we immediately return the full res image below
        return convertFileSrc(absoluteImgPath); // Return the original full-resolution image while the thumbnail is being generated asynchronously.
    }
}

/**
 * Generates a thumbnail for the given image by scaling it to the target size and saves it to the specified directory.
 *
 * @param {string} imgPath - The path to the source image.
 * @param {number} maxPixelSize - The maximum pixel size for the thumbnail's longest side (width or height).
 * @param {string} thumbnailPath - The absolute path where the thumbnail will be saved.
 * @returns {Promise<string>} - A promise that resolves to the URL of the saved thumbnail.
 */
async function generateThumbnail(imgPath: string, maxPixelSize: number, thumbnailPath: string): Promise<string>
{
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext('2d')
    if (!ctx)
    {
        console.error('Context not available');
        return Promise.resolve(convertFileSrc(imgPath));
    }

    return new Promise(async (resolve, reject) => {
        if (imgPath.getFileExtension() === "gif")
        { // We don't generate thumbnails for GIFs, to preserve their motion.
            resolve(convertFileSrc(imgPath));
        }
        else if (imageExtensions.includes(imgPath.getFileExtension()))
        {
            const img = new Image();
            img.onerror = reject
            img.onload = function () {
                const scaleRatio = maxPixelSize / Math.min(img.width, img.height)
                const w = img.width * scaleRatio
                const h = img.height * scaleRatio
                canvas.width = w
                canvas.height = h
                ctx.drawImage(img, 0, 0, w, h)
                canvas.toBlob(async blob => {
                    await createDir(thumbnailPath.getDirectoryPath(), {recursive: true});
                    await writeBinaryFile(thumbnailPath, await blob!.arrayBuffer())
                    resolve(convertFileSrc(thumbnailPath));
                },
                "image/webp", 0.85)
            }

            img.crossOrigin = "anonymous"; //Enable cross-origin access for external URLs.
            // If we don't do this, the URL we get from `convertFileSrc()` (https://asset.localhost/...) will be seen as an external URL and therefore we won't be allowed to call `canvas.toDataUrl()`. Because that will throw the error "toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported."

            img.src = convertFileSrc(imgPath);
        }
    })
}