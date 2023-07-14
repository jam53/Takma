import {createDir, readBinaryFile, removeFile, writeBinaryFile} from "@tauri-apps/api/fs";
import {SaveLoadManager} from "./SaveLoad/SaveLoadManager";

/**
 * This function takes the path to a file the user selected and the board the file belongs to.
 * The function then saves the file to Takma's "Files" data folder, and returns the path to the location of the saved file.
 */
export async function saveFilePathToDisk(pathToFile: string, boardID: string): Promise<string>
{
    const fileData = await readBinaryFile(pathToFile);

    const filename = crypto.randomUUID() + pathToFile.split('/').pop().split("\\").pop(); //Dit extraheert de filename. Zou zowel op window/unix moeten werken omdat we en / en \ doen. We pakken dus alles na de laatste slash met pop. of dus naam.extentie. We voegen er ook nog een random uuid aan toe, om te voorkomen dat we foto's met dezelfde naam overschrijven

    return await saveArrayBufferToDisk(fileData, filename, boardID);
}

/**
 * This function takes a File object that the user selected and the board the file belongs to.
 * The function then saves the file to Takma's "Files" data folder, and returns the path to the location of the saved file.
 */
export async function saveFileToDisk(file: File, boardID: string): Promise<string>
{
    const fileData = await file.arrayBuffer();

    const filename = crypto.randomUUID() + file.name;

    return await saveArrayBufferToDisk(fileData, filename, boardID);
}

/**
 * This function saves an ArrayBuffer to Takma's "Files" data folder in a file with the name `filename`, and returns the path to the location of the saved file.
 */
async function saveArrayBufferToDisk(arrayBuffer: ArrayBuffer, filename: string, boardID: string): Promise<string>
{
    let savePath = `./Takma/Files/${boardID}/`;

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
 * All image file extensions that we can display with `<img src="">`
 */
export let imageExtensions: string[] = ["jpg", "jpeg", "jpe", "jif", "jfif", "jfi", "png", "gif", "webp", "tiff", "tif", "psd", "raw", "nef", "arw", "cr2", "nrw", "k25", "bmp", "dib", "heif", "heic", "ind", "indd", "indt", "jp2", "j2k", "jpf", "jpx", "jpm", "mj2", "ai", "eps", "apng", "avif", "pjpeg", "pjp", "ico", "cur"];