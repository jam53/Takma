<script lang="ts">
    import {open as openDialog} from "@tauri-apps/plugin-dialog"
    import {appLocalDataDir, join, normalize, resolveResource} from "@tauri-apps/api/path";
    import {I18n} from "../../scripts/I18n/I18n";
    import {info} from "@tauri-apps/plugin-log";
    import {openPath} from "@tauri-apps/plugin-opener";
    import {invoke} from "@tauri-apps/api/core";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {mount} from "svelte";
    import PopupWindow from "../PopupWindow.svelte";

    async function setSaveLocation(saveDirectoryPath: string)
    {
        // If true this means the user already has a save file but wants to change its location, meaning we should move it from the previous location to the new one
        if (!(localStorage.getItem("saveDirectoryPath") === null)) {
            const from = await join(localStorage.getItem("saveDirectoryPath")!, SaveLoadManager.getSaveDirectoryName());
            const to = await join(saveDirectoryPath, SaveLoadManager.getSaveDirectoryName());

            try
            {
                info(`Moving save directory from "${from}" to "${to}"`)
                await invoke('move_directory', {from, to});
            }
            catch
            {
                const popup = mount(PopupWindow, {props: {title: I18n.t("folderExistsTitle"), description: I18n.t("folderExistsDescription", saveDirectoryPath), buttonType: "ok"}, target: document.body, intro: true});
                await popup.getAnswer();
                return;
            }
        }

        info(`Setting save directory path to: "${saveDirectoryPath}"`);
        localStorage.setItem("saveDirectoryPath", await normalize(saveDirectoryPath));
        location.reload(); // This refreshes our app/website. If we don't do this we would remain on the ChooseSaveLocationScreen.svelte because Svelte wouldn't see that `{#if localstorage.getItem("saveLocation") === null}` had been changed in App.svelte.
    }

    async function handleDirectorySelection()
    {
        const selectedDirectory = await openDialog({
            directory: true,
            multiple: false,
        });
        if (selectedDirectory !== null && typeof(selectedDirectory) === "string")
        {
            await setSaveLocation(selectedDirectory);
        }
    }
</script>

<h1 class="title">
    {I18n.t("storeDataLocation")}
</h1>
<div class="optionsHolder">
    <div>
        <span class="defaultTag">
            {I18n.t("default")}
        </span>
        <div class="option" onclick={async () => await setSaveLocation(await appLocalDataDir())}>
            <h1>
                {I18n.t("localAppData")}
            </h1>
            <p>
                {I18n.t("storeDataLocalAppData")}
            </p>
            <p>
                {I18n.t("recommendedChoice")}
            </p>
        </div>
    </div>
    <div>
        <span class="defaultTag" style="visibility: hidden">
            {I18n.t("default")}
        </span>
        <div class="option" onclick={async () => await handleDirectorySelection()}>
            <h1>
                {I18n.t("customSaveLocation")}
            </h1>
            <p>
                {I18n.t("storeDataCustomSaveLocation")}
            </p>
            <p>
                {I18n.t("storeDataCustomSaveLocationDescription")}
            </p>
        </div>
    </div>
</div>
<div class="licenseAgreement">
    <span>
        {I18n.t("acceptTermsAndConditions")}<a onclick={async () => openPath(await resolveResource("resources/LICENSE.txt"))}>{I18n.t("licenseAgreement")}</a>
    </span>
</div>

<style>
    .title {
        text-align: center;
        font-size: xxx-large;
        color: white;
    }

    .optionsHolder {
        display: flex;
        justify-content: space-evenly;
        height: 70%;
        align-items: center;
        color: white;
    }

    .defaultTag {
        color: var(--accent);
        text-transform: uppercase;
        font-size: small;
        background-color: white;
        padding: 0.35em 0.5em;
        border-radius: 0.5em;
        position: relative;
        top: -1em;
        transition: 0.4s;
    }

    .option {
        border: 3px solid white;
        border-radius: 1em;
        width: 30vw;
        height: 40vh;
        padding: 1em;
        overflow-y: auto;
        backdrop-filter: blur(10px);

        /*  needed for firefox to have a valid output */
        --transparency: 100%;
        /**/
        transition: --transparency 0.4s, all 0.4s;
        background: linear-gradient(transparent var(--transparency), #404040);
    }

    @property --transparency{
        syntax: '<percentage>';
        inherits: false;
        initial-value: 100%;
    }

    .option:hover {
        cursor: pointer;
        border: 3px solid var(--accent);
        --transparency:30%;
        box-shadow: 0 0 1em rgba(var(--main-text-rgb-values), 0.25);
    }

    ::-webkit-scrollbar-track {
        margin: 0.35em 0;
    }

    .option h1 {
        text-transform: capitalize;
        margin-top: 0;
        text-align: center;
    }

    .licenseAgreement {
        position: fixed;
        bottom: 0;
        left: 0;
        padding: 0.5em;
        color: white;
        width: 100%;
        text-align: center;
    }

    .licenseAgreement span {
        background-color: rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
        border-radius: 1em;
        color: dimgrey;
    }

    .licenseAgreement span a {
        color: #3c609b;
        text-decoration: underline;
        cursor: pointer;
        transition: 0.3s;
    }

    .licenseAgreement span a:hover {
        color: #3B81F4FF;
    }

    p {
        font-size: large;
    }
</style>