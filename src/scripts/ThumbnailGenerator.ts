import {exists, writeFile, readFile} from "@tauri-apps/plugin-fs";
import {convertFileSrc} from "@tauri-apps/api/core";
import {SaveLoadManager} from "./SaveLoad/SaveLoadManager";
import {join} from "@tauri-apps/api/path";
import {imageExtensions} from "./TakmaDataFolderIO";
import XXH from "xxhashjs";
import ThumbnailWorker from "./Thumbnail.worker.ts?worker";

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

    let absoluteImgPath = imgPathIsAbsolute ? imgPath : await join(SaveLoadManager.getSaveDirectoryPath(), imgPath); // Image paths in Takma are stored relative to the save directory. This resolves the relative path to an absolute one.
    let absoluteThumbnailPath = await join(await SaveLoadManager.getTempDirectoryPath(), hashedImgName);

    // We don't generate thumbnails for GIFs, to preserve their motion.
    if (absoluteImgPath.getFileExtension().toLowerCase() === "gif" || !imageExtensions.includes(absoluteImgPath.getFileExtension().toLowerCase()))
    {
        return convertFileSrc(absoluteImgPath);
    }
    else if (await exists(absoluteThumbnailPath))
    {
        return convertFileSrc(absoluteThumbnailPath);
    }
    else
    {
        generateThumbnailInWorker(absoluteImgPath, maxPixelSize, absoluteThumbnailPath); // We don't await this function since we want the thumbnail generation to happen in the background, instead we immediately return the full res image below
        return convertFileSrc(absoluteImgPath); // Return the original full-resolution image while the thumbnail is being generated asynchronously.
    }
}

/**
 * Generates a thumbnail inside a Web Worker for the given image by scaling it to the target size and saves it to the specified directory.
 *
 * The worker:
 * - receives an ArrayBuffer (original image data)
 * - decodes and scales it using OffscreenCanvas
 * - sends back a WebP buffer
 *
 * This avoids blocking the main UI thread.
 *
 * @param {string} imgPath - The path to the source image.
 * @param {number} maxPixelSize - The maximum pixel size for the thumbnail's longest side (width or height).
 * @param {string} thumbnailPath - The absolute path where the thumbnail will be saved.
 * @returns {Promise<string>} - A promise that resolves to the URL of the saved thumbnail.
 */
async function generateThumbnailInWorker(
    imgPath: string,
    maxPixelSize: number,
    thumbnailPath: string
): Promise<string>
{
    return new Promise(async (resolve, reject) => {
        const worker = new ThumbnailWorker();

        worker.onmessage = async (
            e: MessageEvent<{ buffer?: ArrayBuffer; error?: string }>
        ) => {
            if (e.data.error) {
                console.error("Thumbnail worker error:", e.data.error);
                worker.terminate();
                reject(new Error(e.data.error));
                return;
            }

            try {
                const buffer = e.data.buffer!;
                await writeFile(thumbnailPath, new Uint8Array(buffer));
                worker.terminate();
                resolve(convertFileSrc(thumbnailPath));
            } catch (err) {
                worker.terminate();
                reject(err);
            }
        };

        try {
            const fileBytes: Uint8Array = await readFile(imgPath);

            worker.postMessage(
                {
                    fileBytes: fileBytes.buffer,
                    maxPixelSize,
                },
                [fileBytes.buffer] // Transfer ownership to worker
            );
        } catch (err) {
            worker.terminate();
            reject(err);
        }
    });
}