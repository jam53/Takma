import {BaseDirectory, copyFile, createDir, removeFile, writeBinaryFile} from "@tauri-apps/api/fs";
import {SaveLoadManager} from "./SaveLoad/SaveLoadManager";
import {tempdir} from "@tauri-apps/api/os";

/**
 * This function takes the path to a file the user selected and the board the file belongs to.
 * The function then saves the file to Takma's "Files" data folder, and returns the path to the location of the saved file.
 * @param pathToFile path to the file that will be copied and saved to disk by disk function
 * @param boardID the id of the board this file belongs to
 * @param filename optional parameter, if passed this string will be used as the filename. By default the filename of the `pathToFile` parameter gets used. Do note that the provided `filename` string will be preceeded with an id. So the actual file on disk will have the filename: <random id>+`filename`
 */
export async function saveFilePathToDisk(pathToFile: string, boardID: string, filename?: string): Promise<string>
{
    filename = filename ?? pathToFile.split('/').pop().split("\\").pop(); //Dit extraheert de filename. Zou zowel op window/unix moeten werken omdat we en / en \ doen. We pakken dus alles na de laatste slash met pop. of dus naam.extentie. We voegen er ook nog een random uuid aan toe, om te voorkomen dat we foto's met dezelfde naam overschrijven
    filename = trimLongFilename(crypto.randomUUID() + filename);

    let savePath = `${SaveLoadManager.getBoardFilesPath() + boardID}/`;

    await createDir(savePath, {dir: SaveLoadManager.getSaveDirectory(), recursive: true});

    savePath += filename;

    await copyFile(pathToFile, savePath, {dir: SaveLoadManager.getSaveDirectory()});

    return savePath
}

/**
 * This function takes the path to a file the user selected and the board the file belongs to.
 * The function then saves the file to the system's temp folder, and returns the path to the location of the saved file.
 */
export async function saveFilePathToTempfile(pathToFile: string): Promise<string>
{

    let filename = pathToFile.split('/').pop().split("\\").pop()!; //Dit extraheert de filename. Zou zowel op window/unix moeten werken omdat we en / en \ doen. We pakken dus alles na de laatste slash met pop. of dus naam.extentie. We voegen er ook nog een random uuid aan toe, om te voorkomen dat we foto's met dezelfde naam overschrijven

    filename = trimLongFilename(filename);

    let savePath = await tempdir() + crypto.randomUUID() + "/";

    await createDir(savePath, {dir: BaseDirectory.Temp, recursive: true});

    savePath += filename;

    await copyFile(pathToFile, savePath, {dir: SaveLoadManager.getSaveDirectory()});

    return savePath
}

/**
 * This function takes a File object that the user selected and the board the file belongs to.
 * The function then saves the file to Takma's "Files" data folder, and returns the path to the location of the saved file.
 *
 * @deprecated This function reads/writes bytes to memory. In Tauri this causes a major memory overhead because all the bytes need be encoded/decoded to/from json to be sent between the back/front-end
 */
export async function saveFileToDisk(file: File, boardID: string): Promise<string>
{
    const fileData = await file.arrayBuffer();

    const filename = trimLongFilename(crypto.randomUUID() + file.name);

    return await saveArrayBufferToDisk(fileData, filename, boardID);
}

/**
 * This function saves an ArrayBuffer to Takma's "Files" data folder in a file with the name `filename`, and returns the path to the location of the saved file.
 *
 * @deprecated We should try to avoid using this function. As using the `writeBinaryFile()` and `readBinaryFile()` functions cause a lot of overhead.
 * Rather than just passing the provided byte array to and from the back/front-end. The binary data gets converted to a JSON string because of the IPC Tauri uses, and then back from a JSON string to a byte array. This causes massive overhead, both in memory usage and in performance.
 * Instead, we should use the `convertFileSrc()` method that Tauri provides, to directly get a link to an image from a filepath for example. Rather than reading the image file's bytes. And we should use `copyFile()` to copy one filepath to another location for example. Rather than reading the bytes from a file manually and writing the file manually using `readBinaryFile()` and `writeBinaryFile()` respectively.
 */
export async function saveArrayBufferToDisk(arrayBuffer: ArrayBuffer, filename: string, boardID: string): Promise<string>
{
    filename = trimLongFilename(filename);

    let savePath = `${SaveLoadManager.getBoardFilesPath() + boardID}/`;

    await createDir(savePath, {dir: SaveLoadManager.getSaveDirectory(), recursive: true});

    savePath += filename;

    await writeBinaryFile(savePath, arrayBuffer, {dir: SaveLoadManager.getSaveDirectory()});

    return savePath
}

/**
 * This function removes a file saved in Takma's "Files" data folder
 * @param pathToFile a relative file path, starting in the "Files" data folder of Takma
 */
export async function removeFileFromTakmaDataFolder(pathToFile: string)
{
    await removeFile(pathToFile, {dir: SaveLoadManager.getSaveDirectory()});
}

/**
 * Windows limits the length of a filename to 255 characters. Given a filename, this functions returns the same filename if it's shorter than or equal to 255 characters. Otherwise it returns the substring of the first 255 - (length file extension) characters of the filename + the file extension
 */
function trimLongFilename(filename: string): string
{
    const maxFilenameLength = 255;

    if (filename.length >= maxFilenameLength && filename.indexOf('.') !== -1)
    {
        let fileExtension = "." + filename.split(".").pop()!;

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