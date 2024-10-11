import {BaseDirectory, readBinaryFile} from '@tauri-apps/plugin-fs';

/**
 * Given a path to an image file, this function returns an url to the image.
 *
 * @deprecated Note: This method was initially created as a workaround for displaying images in Tauri's webview
 * by manually converting the image file data to a Blob and creating a data URL from that Blob.
 *
 * Recommendation: As of Tauri version 1.0.0, consider using the `convertFileSrc` method from
 * '@tauri-apps/api/tauri' for a more direct and efficient way to convert a file path to a webview-compatible URL.
 * The `convertFileSrc` method handles the conversion internally, providing a cleaner and potentially
 * more maintainable solution.
 *
 * @param path Path to the image file. It can be either an absolute path or a relative path.
 * @param baseDirectory Optional base directory from which the relative path starts. Only required if the path is relative.
 * @returns {string} The URL to the image.
 */
export async function getImageUrl(path: string, baseDirectory?: BaseDirectory)
{
    let imageData;
    try
    {
        if (baseDirectory)
        {
            imageData = await readBinaryFile(path, { dir: baseDirectory });
        }
        else
        {
            imageData = await readBinaryFile(path);
        }
    }
    catch
    {
        console.log("Couldn't load image with path: " + path)
        imageData = null; //Loading the image file caused an error, so instead we will return an empty image. In the UI this will show HTML's placeholder image icon thingy
    }

    const blob = new Blob([imageData], { type: "image" });
    return URL.createObjectURL(blob);
}