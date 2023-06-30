import {BaseDirectory, readBinaryFile} from '@tauri-apps/api/fs';

/**
 * Given a path to an image file, this function returns an url to the image.
 *
 * We cant just use the path of the image as the src for our img tags because of how Tauri works. Instead we read the image path as a binary file, create a blob and then create an url from that blob
 * @param path Path to the image file. It can be either an absolute path or a relative path.
 * @param baseDirectory Optional base directory from which the relative path starts. Only required if the path is relative.
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