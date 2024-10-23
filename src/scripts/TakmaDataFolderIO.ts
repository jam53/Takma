import {SaveLoadManager} from "./SaveLoad/SaveLoadManager";

/**
 * Copies a file from the provided relative path (starting in Takma's save directory) to a new file in a subfolder named after the board ID within Takma's save directory.
 * Returns the new file's relative path.
 *
 * @param pathToFile - The relative path (from Takma's save directory) of the file to save.
 * @param boardID - The unique ID of the board the file is associated with.
 * @param filename - (Optional) The desired filename. If not provided, the original filename from `pathToFile` is used.
 *                   A random UUID will be prepended to the filename to ensure uniqueness.
 * @returns A promise that resolves to the relative path of the saved file.
 */
export async function saveFilePathToSaveDirectory(pathToFile: string, boardID: string, filename?: string): Promise<string>
{
    return pathToFile;
}

/**
 * Saves a file from an absolute path into Takma's save directory for a specific board.
 * Generates a unique filename by prepending a random UUID to the original filename to avoid conflicts.
 * Returns the relative path to the saved file.
 *
 * @param pathToFile - The absolute path of the file to be saved.
 * @param boardID - The unique ID of the board the file is associated with.
 * @param filename - (Optional) Desired filename. If not provided, the original filename from `pathToFile` is used.
 *                   A random UUID is prepended to ensure uniqueness.
 * @returns A promise that resolves to the relative path of the saved file.
 */
export async function saveAbsoluteFilePathToSaveDirectory(pathToFile: string, boardID: string, filename?: string): Promise<string>
{
    return pathToFile;
}

/**
 * Copies a file from a relative path (within Takma's save directory) to the temporary folder.
 * Returns the absolute path to the file in the temporary folder.
 *
 * @param pathToFile - The relative path (from Takma's save directory) of the file to save temporarily.
 * @param filename - (Optional) The desired filename. If not provided, the original filename from `pathToFile` is used.
 *                   A random UUID will be prepended to the filename to ensure uniqueness.
 * @returns A promise that resolves to the absolute path of the saved file in the temp folder.
 */
export async function saveFilePathToTempFile(pathToFile: string, filename?: string): Promise<string>
{
    return pathToFile;
}

/**
 * Copies a file from an absolute path to the specified save directory.
 * Returns the absolute path to the saved file.
 *
 * @param pathToFile - The absolute path of the file to be saved.
 * @param filename - The name of the file to save.
 * @param savePath - The absolute path of the destination directory where the file will be saved.
 * @returns A promise that resolves to the absolute path of the saved file.
 */
async function saveAbsoluteFilePathToDisk(pathToFile: string, filename: string, savePath: string): Promise<string>
{
    return pathToFile;
}

/**
 * Saves a File object to Takma's save directory for a specific board.
 * The file's data is read and stored, and a random UUID is prepended to the filename to avoid conflicts.
 * Returns the relative path to the saved file.
 *
 * @param file - The File object to save.
 * @param boardID - The unique ID of the board the file is associated with.
 * @returns A promise that resolves to the relative path of the saved file.
 */
export async function saveFileToSaveDirectory(file: File, boardID: string): Promise<string>
{
    return "";
}

/**
 * Saves a binary `Uint8Array` to Takma's save directory for a specific board.
 * A file with the specified filename is created, and the binary data is written to disk.
 * Returns the relative path to the saved file.
 *
 * @param uint8Array - The `Uint8Array` containing the binary file data.
 * @param filename - The desired name for the file to be saved.
 * @param boardID - The unique ID of the board the file is associated with.
 * @returns A promise that resolves to the relative path of the saved file.
 */
async function saveArrayBufferToSaveDirectory(uint8Array: Uint8Array, filename: string, boardID: string): Promise<string>
{
    return filename;
}

/**
 * Removes a file from Takma's save directory.
 *
 * @param pathToFile - The relative path (within Takma's save directory) of the file to be removed.
 * @returns A promise that resolves when the file is successfully deleted.
 */
export async function removeFileFromSaveDirectory(pathToFile: string)
{
    return;
}

/**
 * Windows limits the length of a filename to 255 characters. Given a filename, this functions returns the same filename if it's shorter than or equal to 255 characters. Otherwise it returns the substring of the first 255 - (length file extension) characters of the filename + the file extension
 */
function trimLongFilename(filename: string): string
{
    const maxFilenameLength = 255;

    if (filename.length >= maxFilenameLength && filename.indexOf('.') !== -1)
    {
        let fileExtension = "." + filename.getFileExtension();

        return filename.substring(0, maxFilenameLength - fileExtension.length) + fileExtension;
    }
    else if (filename.length >= maxFilenameLength && filename.indexOf('.') === -1)
    {
        return filename.substring(0, maxFilenameLength);
    }
    else
    {
        return filename;
    }
}

/**
 * All image file extensions that we can display with `<img src="">`
 */
export let imageExtensions: string[] = ["jpg", "jpeg", "jpe", "jif", "jfif", "jfi", "png", "gif", "webp", "tiff", "tif", "psd", "raw", "nef", "arw", "cr2", "nrw", "k25", "bmp", "dib", "heif", "heic", "ind", "indd", "indt", "jp2", "j2k", "jpf", "jpx", "jpm", "mj2", "ai", "eps", "apng", "avif", "pjpeg", "pjp", "ico", "cur"];