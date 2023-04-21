import {SaveLoadManager} from "./SaveLoadManager";

/**
 * This is a "data class" that holds all the data/variables that need to be persistent between different sessions
 * + it sets the default value for these variables
 */
export class TakmaData
{
    //region data/variables
    private _appName: string = "Takma"; //The name of the app
    //endregion

    //region getters and setters
    /**
     * This function returns the name of the app
     */
    get appName(): string
    {
        return this._appName;
    }

    // This function sets the name of the app
    set appName(value: string)
    {
        this._appName = value;
        SaveLoadManager.saveToDisk();
    }
    //endregion
}