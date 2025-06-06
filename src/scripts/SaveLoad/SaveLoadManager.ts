import {mkdir, exists, readTextFile, writeTextFile} from "@tauri-apps/plugin-fs";
import {TakmaData} from "./TakmaData";
import {message} from "@tauri-apps/plugin-dialog";
import {join} from "@tauri-apps/api/path";
import {I18n} from "../I18n/I18n";
import {tempDir} from "@tauri-apps/api/path";
import "../StringExtensions.ts";
import {debug, info, warn} from "@tauri-apps/plugin-log";

/**
 * This class is used to save/load data within Takma
 */
export class SaveLoadManager
{
    private static saveDirectoryName: string;
    private static saveFilename: string;
    private static boardFilesDirectory: string;
    private static saveDirectoryPath: string;
    private static data: TakmaData;

    static
    {
        this.saveDirectoryName = "Takma";
        this.saveFilename = `./${this.getSaveDirectoryName()}/Takma.json`;
        this.boardFilesDirectory = `./${this.getSaveDirectoryName()}/Files/`;
        this.saveDirectoryPath = localStorage.getItem("saveDirectoryPath")!; // In App.svelte (i.e. Takma's entry point) we only create an SaveLoadManager instance once the `localStorage.getItem("saveDirectoryPath")` has been set. If not and it's null, we show a screen to the user where they can set their save location. Therefore we can be sure that this will never be null

        this.data = new TakmaData();
        /* Our TakmaData object holds all the variables + instantiated with their default values.
         * Later we will overwrite this data object with the user's save file.
         * --- If the user opens Takma for the first time, we will only have the default values and nothing will be overwritten
         * If the user updates to a new version, a part of the default values will be overwritten, and new variables that weren't there in the previous release, will have their default value
         */
    }

    /**
     * This method loads the save file from the disk. And overwrites the default values inside the "data" object
     */
    public static async loadSaveFileFromDisk(): Promise<void>
    {
        const pathToSavefile = await this.getSaveFilePath();
        await mkdir(pathToSavefile.getDirectoryPath(), {recursive: true}); //Should the folder not exist and we don't create it here, the next if where we check if the savefile exists with `exists(...)` will throw an error.

        if (await exists(pathToSavefile)) //Check if the save file exists, before trying to use it to overwrite the default values
        {
            let fileContents: string = await readTextFile(pathToSavefile);
            try 
            {
                Object.assign(this.data, JSON.parse(fileContents));
                /* Load the user's save file and use it to overwrite the default values. Leave new default values that aren't present in the user's save file untouched
                 * ---
                 * The reason as to why we write `Object.assign(this.data, JSON.parse(fileContents));`
                 * `And not this.data = JSON.parse(fileContents));`
                 * is because the latter overwritese all the values `in this.data`.
                 * ---
                 * This makes it so that only the data from in `filecontents` is being kept. This means that all of the variables/entries/keys already defined in `this.data` will be lost.
                 * This is less than ideal since when we release a new update, where we add a new variable/entry/key. It will never be added to the savefile.
                 * This is because the new entry will be in `this.data`, but then all the values in there will be overwritten by `filecontents`. Thus we will lose that new entry
                 * ---
                 * If we instead use `Object.assign`, we won't have this problem since the keys from filecontents get copied over and replace the values of any existing keys, but leave new keys that exist in `this.data` but not in filecontents alone.
                 */
                await info(`Save file loaded successfully from: "${pathToSavefile}"`);
            }
            catch (error)
            {
                const savePath: string = await join(this.getSaveDirectoryPath(), this.saveFilename + "_Corrupted" + "." + this.saveFilename.getFileExtension());
                await writeTextFile(savePath, fileContents);
                await message(I18n.t("corruptedSaveFileReplacement") + savePath, { title: "Takma", kind: "error" });
                await warn("Encountered corrupted save file, created a new empty save file and placed the corrupted save file at: " + savePath);
            }
        }

        await this.saveToDisk(); //Normally we would just save the exact same json that's already saved to the disk. The only exception to this is when there are new default values (i.e. a there was an update, that added additional data/variables to the save file)
        //, then we will actually write new stuff to the save file
    }

    /**
     * This method saves the variables inside the "data" object as a JSON to the disk.
     */
    public static async saveToDisk(): Promise<void>
    {
        debug("Saving save file to disk");
        await writeTextFile(await join(this.getSaveDirectoryPath(), this.saveFilename), JSON.stringify(this.data, null, 0));
    }

    /**
     * This method returns an instance of our data class.
     *
     * If we want to load for example the "version" variable stored inside the data class, we can do so by using this `getData` method as follows:
     * SaveLoadManager.getData().version;
     *
     * If we want to save/update the value of the "version" variable stored inside the data class, we can do so by using this `getData` method as follows:
     * SaveLoadManager.getData().version = "1.0.0";
     *
     * As you can see, we can use the variables as if they were public variables, rather than having to use getter/setter function.
     * In reality getter/setter functions are defined in our data class. But in TypeScript if you define a get / set function for a variable.
     * You dont have to write anything of the form getVar() setVar(...). But you can just write the name of the variable
     */
    public static getData(): TakmaData
    {
        return this.data;
    }

    /**
     * This function returns the directory used for saving the user's data as an absolute path
     */
    public static getSaveDirectoryPath(): string
    {
        return this.saveDirectoryPath;
    }

    /**
     * Returns the relative path to the subfolder within the save directory where files related to boards are stored.
     *
     * Within this subfolder, a separate subfolder should be present for each board. Each board's subfolder is named using the ID of the board.
     * For example, if the base path is `/Takma/Files/`, and a board has the ID `12345`, the path for that board's files would be `/Takma/Files/12345/`.
     */
    public static getBoardFilesDirectory(): string
    {
        return this.boardFilesDirectory;
    }

    /**
     * Returns the absolute path to the directory used for temporary files.
     */
    public static async getTempDirectoryPath(): Promise<string>
    {
        return await join(await tempDir(), this.getSaveDirectoryName());
    }

    /**
     * Returns the absolute path to the save file used for saving the user's data
     */
    public static async getSaveFilePath(): Promise<string>
    {
        return await join(this.getSaveDirectoryPath(), this.saveFilename);
    }

    /**
     * Returns the name of the directory in which the user's data is saved
     */
    public static getSaveDirectoryName(): string
    {
        return this.saveDirectoryName;
    }
}