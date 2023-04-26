import {SaveLoadManager} from "./SaveLoadManager";

/**
 * This is a "data class" that holds all the data/variables that need to be persistent between different sessions
 * + it sets the default value for these variables
 */
export class TakmaData
{
    //region data/variables
    private _darkTheme: boolean = window.matchMedia("(prefers-color-scheme: dark)").matches; //This sets the value based on the user's preferred system color theme. If the os' color theme is set to dark, this will return true. Else it will returns false
    //endregion

    //region getters and setters
    /**
     * This function returns the `true` if the color theme of the app is set to dark, `false` if white theme is selected
     */
    get darkTheme(): boolean
    {
        return this._darkTheme;
    }

    // This function sets whether or not the app's selected color theme is dark
    set darkTheme(value: boolean)
    {
        this._darkTheme = value;
        SaveLoadManager.saveToDisk();
    }
    //endregion
}