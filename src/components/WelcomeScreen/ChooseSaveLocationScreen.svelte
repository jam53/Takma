<script lang="ts">
    import {BaseDirectory} from "@tauri-apps/api/fs";
    import {open} from "@tauri-apps/api/shell";
    import {resolveResource} from "@tauri-apps/api/path";
    import {I18n} from "../../scripts/I18n/I18n";

    function setSaveLocation(saveLocation: BaseDirectory)
    {
        localStorage.setItem("saveLocation", saveLocation.toString());
        location.reload(); //Zorgt dat onze app/website refreshed. Anders zouden we op het ChooseSaveLocationScreen.svelte blijven staan omdat svelte niet zal zien dat `{#if localstorage.getItem(“saveLocation”) === null}` werd aangepast in App.svelte
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
        <div class="option" on:click={() => setSaveLocation(BaseDirectory.AppLocalData)}>
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
        <div class="option" on:click={() => setSaveLocation(BaseDirectory.Document)}>
            <h1>
                {I18n.t("myDocumentsDirectory")}
            </h1>
            <p>
                {I18n.t("storeDataMyDocuments")}
            </p>
            <p>
                {I18n.t("recommendedChoiceOneDrive")}
            </p>
        </div>
    </div>
</div>
<div class="licenseAgreement">
    <span>
        {I18n.t("acceptTermsAndConditions")}<a on:click={async () => open((await resolveResource("resources/LICENSE.txt")).substring(4))}>{I18n.t("licenseAgreement")}</a>
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
        -webkit-box-shadow: 0 0 1em rgba(var(--main-text-rgb-values), 0.25);
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
</style>