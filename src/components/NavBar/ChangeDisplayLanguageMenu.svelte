<script lang="ts">
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {I18n} from "../../scripts/I18n/I18n";
    import OptionsMenu from "../OptionsMenu.svelte";

    interface Props {
        clickEvent: MouseEvent,
    }

    let { clickEvent }: Props = $props();

    /**
     * Once the user picks a display language, we need to refresh the UI in order to reflect the changes
     */
    function refreshWelcomeScreen()
    {
        // This means the savefile hasn't been loaded in yet, therefore we are still on the ChooseSaveLocationScreen and we can do `location.reload()`
        if (SaveLoadManager.getData().totalCardsCreated == 0)
        {
            location.reload();
        }
        // This means the savefile has been loaded in, if we would refresh the website using `location.reload()`, we would lose the selected savefile. Which is why we only close the context menu, in this case only on the next screen change/UI update will the correct language be displayed.
        else
        {
            closeContextMenu();
        }
    }

    /**
     * Sets the display language in which Takma should be displayed.
     */
    async function setDisplayLanguage(language: string)
    {
        // If the save location for the save file hasn't been set yet. I.e. when the user opened Takma for the first time and is presented the ChooseSaveLocation screen. The user still has the ability to pick a display language.
        // Which is why this function will store the language preference temporarily in the browser's local storage if that is the case. Once a save location has been set, the language preference is saved to Takma's save file.
        if (localStorage.getItem("saveDirectoryPath") === null)
        {
            localStorage.setItem("displayLanguage", language);
        }
        else
        {
            await SaveLoadManager.getData().setDisplayLanguage(language);
        }
    }

    let menuItems = [
        {
            'name': 'arabic',
            'onClick': async () => {await setDisplayLanguage("ar"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("ar")} (${I18n.t("arInAr")})`,
            'svg': ''
        },
        {
            'name': 'german',
            'onClick': async () => {await setDisplayLanguage("de"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("de")} (${I18n.t("deInDe")})`,
            'svg': ''
        },
        {
            'name': 'english',
            'onClick': async () => {await setDisplayLanguage("en"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("en")} (${I18n.t("enInEn")})`,
            'svg': ''
        },
        {
            'name': 'spanish',
            'onClick': async () => {await setDisplayLanguage("es"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("es")} (${I18n.t("esInEs")})`,
            'svg': ''
        },
        {
            'name': 'estonian',
            'onClick': async () => {await setDisplayLanguage("et"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("et")} (${I18n.t("etInEt")})`,
            'svg': ''
        },
        {
            'name': 'french',
            'onClick': async () => {await setDisplayLanguage("fr"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("fr")} (${I18n.t("frInFr")})`,
            'svg': ''
        },
        {
            'name': 'hindi',
            'onClick': async () => {await setDisplayLanguage("hi"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("hi")} (${I18n.t("hiInHi")})`,
            'svg': ''
        },
        {
            'name': 'indonesian',
            'onClick': async () => {await setDisplayLanguage("id"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("id")} (${I18n.t("idInId")})`,
            'svg': ''
        },
        {
            'name': 'japanese',
            'onClick': async () => {await setDisplayLanguage("ja"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("ja")} (${I18n.t("jaInJa")})`,
            'svg': ''
        },
        {
            'name': 'korean',
            'onClick': async () => {await setDisplayLanguage("ko"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("ko")} (${I18n.t("koInKo")})`,
            'svg': ''
        },
        {
            'name': 'dutch',
            'onClick': async () => {await setDisplayLanguage("nl"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("nl")} (${I18n.t("nlInNl")})`,
            'svg': ''
        },
        {
            'name': 'portuguese',
            'onClick': async () => {await setDisplayLanguage("pt"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("pt")} (${I18n.t("ptInPt")})`,
            'svg': ''
        },
        {
            'name': 'russian',
            'onClick': async () => {await setDisplayLanguage("ru"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("ru")} (${I18n.t("ruInRu")})`,
            'svg': ''
        },
        {
            'name': 'turkish',
            'onClick': async () => {await setDisplayLanguage("tr"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("tr")} (${I18n.t("trInTr")})`,
            'svg': ''
        },
        {
            'name': 'chinese',
            'onClick': async () => {await setDisplayLanguage("zh"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("zh")} (${I18n.t("zhInZh")})`,
            'svg': ''
        },
    ].sort((a, b) => a.displayText.localeCompare(b.displayText));
</script>

<OptionsMenu
        {clickEvent}
        logMessage={"Opening change display language menu"}
        {menuItems}
/>