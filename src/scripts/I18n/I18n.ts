import type Translation from "./Translation";
import {ar, de, en, es, et, fr, hi, id, ja, ko, nl, pt, ru, tr, zh} from "./Translations";
import {SaveLoadManager} from "../SaveLoad/SaveLoadManager";

/**
 * This class handles anything and everything related to i18n
 */
export class I18n
{
    private static translations: Map<string, Translation>;

    static
    {
        this.translations = new Map<string, Translation>([
            ["en", en],
            ["ar", ar],
            ["de", de],
            ["es", es],
            ["et", et],
            ["fr", fr],
            ["hi", hi],
            ["id", id],
            ["ja", ja],
            ["ko", ko],
            ["nl", nl],
            ["pt", pt],
            ["ru", ru],
            ["tr", tr],
            ["zh", zh],
        ]);
    }

    /**
     * This function returns the translation for a given key.
     * This function can also insert strings into a translation, if the translation is a string. The substrings of the form `$|xx|$` with x a number in the translation string get replaced with the string(s) to be inserted into the translation. An example: exampleKey:"hello $|00|$" -> t("exampleKey", "name") -> "hello name"
     * @param key gets the translation for this key
     * @param wordsToInsert the strings passed to this variable will be inserted into the translation in the order that they were passed to the function.
     * @return Can return any type, most often a string but an object is also possible for example. To see all the types that can be returned check the interface defined in Translation.ts
     */
    public static t(key: string, ...wordsToInsert: string[]): any
    {
        let displayLanguage = SaveLoadManager.getData().displayLanguage;
        displayLanguage = this.translations.has(displayLanguage) ? displayLanguage : "en"; //Default display language to "en" in case the user has a display language set that isn't supported/translated by Takma

        let translation = this.translations.get(displayLanguage)[key] ?? `Translation not found for ${key}`;

        for (let i = 0; i < wordsToInsert.length; i++)
        {
            if (typeof translation === "string")
            {
                translation = translation.replace("$|" + (i + "").padStart(2, "0") + "|$", wordsToInsert[i]);
            }
        }

        return translation;
    }
}