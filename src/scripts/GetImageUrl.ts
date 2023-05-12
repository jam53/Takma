import {BaseDirectory, readBinaryFile} from '@tauri-apps/api/fs';
import indigoDahlia from "../images/backgrounds/indigo dahlia, macro photography, frozen leaves, ice cold, translucent, realistic - DALL·E 2023-05-10 15.35.05_edited_photos_v2_x4.webp"

export let includedImagesInTakma:string[] = [indigoDahlia];


/**
 * Given a path to an image file, this function returns an url to the image.
 *
 * We cant just use the path of the image as the src for our img tags because of how Tauri works. Instead we read the image path as a binary file, create a blob and then create an url from that blob
 * @param path Path to the image file. It can be either an absolute path or a relative path.
 * @param baseDirectory Optional base directory from which the relative path starts. Only required if the path is relative.
 */
export async function getImageUrl(path: string, baseDirectory?: BaseDirectory)
{
    if (includedImagesInTakma.includes(path))
    {
        return path;
    }

    let imageData;
    if (baseDirectory)
    {
        imageData = await readBinaryFile(path, { dir: baseDirectory });
    }
    else
    {
        imageData = await readBinaryFile(path);
    }

    const blob = new Blob([imageData], { type: "image" });
    return URL.createObjectURL(blob);
}