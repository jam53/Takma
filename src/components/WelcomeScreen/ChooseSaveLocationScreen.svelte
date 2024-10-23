<script lang="ts">
    import {I18n} from "../../scripts/I18n/I18n";
    import PopupWindow from "../PopupWindow.svelte";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {savefileSet} from "../../scripts/stores";

    function setSavefile(fileContents: string)
    {
        SaveLoadManager.loadSaveFile(fileContents, () => {
            $savefileSet = true;
            document.body.style.backgroundImage = "";
            document.body.style.backgroundColor = `var(--background-color)`;
        });
    }

    async function handleURLSelection()
    {
        const popup = new PopupWindow({props: {title: I18n.t("enterURL"), description: I18n.t("loadTakmaJsonFromOnlineSource"), inputValue: localStorage.getItem("savefileURL"), buttonType: "input"}, target: document.body, intro: true});

        if (await popup.getAnswer() === true)
        {
            let savefileURL = await popup.getInputFieldAnswer();
            savefileURL = savefileURL.startsWith("https://1drv.ms/u/s!") ? getOneDriveDirectDownloadLink(savefileURL) : savefileURL;

            let response = await fetch(savefileURL);

            localStorage.setItem("savefileURL", savefileURL)
            setSavefile(await response.text());
        }
    }

    /**
     * Converts a OneDrive sharing URL into a direct download link using the Microsoft Graph API.
     *
     * The function first encodes the sharing URL to create a sharing token, which is then used to generate the direct download link. For more details on how to transform a sharing URL into a sharing token visit:
     * https://learn.microsoft.com/en-us/graph/api/shares-get?view=graph-rest-1.0&tabs=http#encoding-sharing-urls
     *
     * @param {string} url - The original OneDrive sharing URL.
     * @returns {string} - The direct download link for the shared file.
     */
    function getOneDriveDirectDownloadLink(url: string): string
    {
        let base64Url = btoa(unescape(encodeURIComponent(url)))
            .replace(/=/g, '')
            .replace(/\//g, "_")
            .replace(/\+/g, "-");

        if (base64Url.endsWith("="))
        {
            base64Url = base64Url.slice(0, -1);
        }

        return `https://api.onedrive.com/v1.0/shares/u!${base64Url}/root/content`;
    }

    async function handleFileSelection(e)
    {
        const file = e.target.files[0];

        if (file)
        {
            setSavefile(await file.text());
        }
    }
</script>

<div class="container">
    <h1 class="title">
        {I18n.t("welcomeToTakmaWebPreview")}
    </h1>
    <div class="bottom">
        <div class="description">
            <pre>
                {I18n.t("thisIsALimitedDemo")}
            </pre>
        </div>
        <div class="optionsHolder">
            <div>
                <span class="defaultTag">
                    {I18n.t("default")}
                </span>
                <label for="file-upload">
                    <input id="file-upload" type="file" accept=".json" on:change={handleFileSelection}
                    />
                    <div class="option">
                        <h1>
                            {I18n.t("selectFile")}
                        </h1>
                        <p>
                            {I18n.t("uploadLocalTakmaJson")}
                        </p>
                    </div>
                </label>
            </div>
            <div>
                <span class="defaultTag" style="visibility: hidden">
                    {I18n.t("default")}
                </span>
                <div class="option" on:click={async () => await handleURLSelection()}>
                    <h1>
                        {I18n.t("enterURL")}
                    </h1>
                    <p>
                        {I18n.t("loadTakmaJsonFromOnlineSource")}
                    </p>
                </div>
            </div>
        </div>
        <div class="licenseAgreement">
            <span>
                {I18n.t("acceptTermsAndConditions")}<a on:click={async () => {
                    let response = await fetch("LICENSE.txt");

                    new PopupWindow({props: {title: I18n.t("licenseAgreement").capitalizeFirstLetter(), description: await response.text(), buttonType: "ok"}, target: document.body, intro: true})
                }}>{I18n.t("licenseAgreement")}</a>
            </span>
        </div>
    </div>
</div>

<style>
    .container {
        display: flex;
        flex-flow: column;
        gap: 2em;

        overflow-y: auto;
        width: 100vw;
        height: 90vh;
    }

    .title {
        text-align: center;
        font-size: xxx-large;
        color: white;
        margin-left: 1em;
        margin-right: 1em;
    }

    .optionsHolder {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        column-gap: 5em;
        row-gap: 2em;
        align-items: center;
        margin: 4em 1em 0 1em;
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
        width: 20em;
        height: 15em;
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
        padding-bottom: 0.5em;
        color: white;
        width: 100%;
        text-align: center;
        background-color: rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
    }

    .licenseAgreement span {

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

    .description {
        display: flex;
        align-items: center;
        flex-direction: column;
        margin: 0 2em;
        max-width: 50em;
    }

    .description pre {
        font-size: large;
        white-space: pre-line;
        text-align: center;
        margin: 0;
        padding: 1em 0.75em;

        background-color: rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(5px);
        -webkit-box-shadow: 0 0 0.6em rgba(0, 0, 0, 0.75);
        border-radius: 1em;
        border: 3px solid rgba(255, 255, 255, 0.1);
    }

    .bottom {
        display: flex;
        flex-flow: column wrap;
        align-content: center;
        gap: 2em;
        padding-bottom: 2em;
    }

    @media only screen and (device-width: 768px) {
        /* default iPad screens */
    }

    input[type="file"] {
        display: none;
    }
</style>