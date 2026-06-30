import {convertFileSrc} from "@tauri-apps/api/core";
import {SaveLoadManager} from "./SaveLoad/SaveLoadManager";

/**
 * Returns an URL for an image.
 *
 * If the `imageSrc` is already an HTTP or HTTPS URL, it's returned directly.
 * If `imageSrc` is a path to a local file, a URL is generated for it using the `convertFileSrc` function.
 *
 * @param imageSrc - The URL or file path of the image.
 * @returns The URL of the image.
 */
export function getImageUrl(imageSrc: string): string
{
    // If the image is a http or https url
    if (imageSrc.match(/^(http|https)/))
    {
        return imageSrc;
    }
    // If the image is saved in Takma's data folder
    else if (imageSrc.startsWith(SaveLoadManager.getBoardFilesDirectory()))
    {
        return convertFileSrc(SaveLoadManager.getSaveDirectoryPath() + imageSrc);
    }
    // If the image is stored somewhere locally on disk
    else
    {
        return convertFileSrc(imageSrc);
    }
}
