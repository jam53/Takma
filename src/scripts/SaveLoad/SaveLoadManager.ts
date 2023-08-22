import {BaseDirectory, createDir, exists, readTextFile, writeTextFile} from "@tauri-apps/api/fs";
import {TakmaData} from "./TakmaData";
import {message} from "@tauri-apps/api/dialog";
import {appLocalDataDir, documentDir} from "@tauri-apps/api/path";
import {I18n} from "../I18n/I18n";

/**
 * This class is used to save/load data within Takma
 */
export class SaveLoadManager
{
    private static saveFilename: string;
    private static saveDirectory: BaseDirectory;
    private static data: TakmaData;

    static
    {
        this.saveFilename = "./Takma/Takma.json";
        this.saveDirectory = parseInt(localStorage.getItem("saveLocation") ?? BaseDirectory.AppLocalData.toString());
        /* Rather than using one of the predefined paths under `BaseDirectory`, we could also just save our data in an arbitrary location.
         * However, this would require us to call a function from Rust who would then write/read to/from the disk.
         * Since we are happy with AppData/Local/com.jam54.Takma, we didn't bother to write to a specific location using a function in the Rust backend.
         * And instead opted to use one of the predefined location to save/load from. Thus allowing us to do the IO entirely in TS, without having to call a Rust function.
         */
        /* The `saveDirectory` variable of type `BaseDirectory` is basically an enum. Where Document = 7 and AppLocalData = 23.
         * So depending on the value of `localStorage.getItem("saveLocation")`, either 7 or 23 we set the `saveDirectory` value.
         * The value of "saveLocation" gets selected by the user in the ChooseSaveLocationScreen.svelte screen.
         * This screen gets show when the value of "saveLocation" === null. But here we also fallback to AppLocalData in case the value of
         * "saveLocation" should be null with the ?? operator
         */
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
        const folderToSave = this.saveFilename.substring(0, this.saveFilename.lastIndexOf("/")); //Extracts the path to the folder where the saveFile is located by removing the saveFile name from the given path.
        await createDir(folderToSave, {dir: SaveLoadManager.getSaveDirectory(), recursive: true}); //Should the folder not exist and we don't create it here, the next if will throw an error.

        if (await exists(this.saveFilename, {dir: this.saveDirectory})) //Check if the save file exists, before trying to use it to overwrite the default values
        {
            let fileContents: string = await readTextFile(this.saveFilename, {dir: this.saveDirectory});
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
            }
            catch (error)
            {
                await writeTextFile(this.saveFilename + "_Corrupted", fileContents, {dir: this.saveDirectory});
                const saveDir: string = await this.getAbsoluteSaveDirectory();
                const savePath: string = saveDir + this.saveFilename + "_Corrupted";
                await message(I18n.t("corruptedSaveFileReplacement") + savePath, { title: "Takma", type: "error" });
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
        await writeTextFile(this.saveFilename, JSON.stringify(this.data, null, 0), {dir: this.saveDirectory});
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
     * This function returns the directory in which we save data
     */
    public static getSaveDirectory(): BaseDirectory
    {
        return this.saveDirectory;
    }

    /**
     * This function returns the directory in which we save data as an absolute path
     */
    public static async getAbsoluteSaveDirectory(): Promise<string>
    {
        return this.getSaveDirectory() === BaseDirectory.AppLocalData ? await appLocalDataDir() : await documentDir();
    }
}