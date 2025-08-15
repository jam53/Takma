<script lang="ts">
    import {I18n} from "../../scripts/I18n/I18n";
    import PopupWindow from "../PopupWindow.svelte";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {isSaveLocationSet} from "../../scripts/Stores.svelte";
    import {mount} from "svelte";

    function setSavefile(fileContents: string)
    {
        SaveLoadManager.loadSaveFile(fileContents, () => {
            isSaveLocationSet.value = true;
            document.body.style.backgroundImage = "";
            document.body.style.backgroundColor = `var(--background-color)`;
        });
    }

    async function handleURLSelection()
    {
        const popup = mount(PopupWindow, {props: {title: I18n.t("enterURL"), description: I18n.t("loadTakmaJsonFromOnlineSource"), inputValue: localStorage.getItem("savefileURL"), buttonType: "input"}, target: document.body, intro: true});

        if (await popup.getAnswer() === true)
        {
            let savefileURL = (await popup.getInputFieldAnswer()).trim();

            let response = await fetch(savefileURL);

            localStorage.setItem("savefileURL", savefileURL)
            setSavefile(await response.text());
        }
    }

    async function handleFileSelection(e)
    {
        const file = e.target.files[0];

        if (file)
        {
            setSavefile(await file.text());
        }
    }

    let installPWAPrompt: BeforeInstallPromptEvent | undefined = $state();
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault(); // Prevents the default mini-infobar or install dialog from appearing on mobile
        installPWAPrompt = e;
    });
</script>

<div class="container">
    <h1 class="title">
        {I18n.t("welcomeToTakmaWebPreview")}
    </h1>
    <div class="bottom">
        <div class="description">
            <pre>
                {@html I18n.t("thisIsALimitedDemo", "<a href='https://jam54.com/download.html'>Jam54 Launcher</a>", "<a href='https://github.com/jam53/Takma/releases/latest'>GitHub</a>")}
            </pre>
        </div>
        {#if installPWAPrompt}
            <div class="description descriptionClickable" onclick={() => installPWAPrompt.prompt()}>
                <pre>{I18n.t("takmaPWAExplanation")}</pre>
            </div>
        {/if}
        <div class="optionsHolder">
            <div>
                <span class="defaultTag">
                    {I18n.t("default")}
                </span>
                <label for="file-upload">
                    <input id="file-upload" type="file" accept=".json" onchange={handleFileSelection}
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
                <div class="option" onclick={async () => await handleURLSelection()}>
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
                {I18n.t("acceptTermsAndConditions")}<a onclick={async () => {
                    let response = await fetch("LICENSE.txt");

                    mount(PopupWindow, {props: {title: I18n.t("licenseAgreement").capitalizeFirstLetter(), description: await response.text(), buttonType: "ok"}, target: document.body, intro: true});
                }}>{I18n.t("licenseAgreement")}</a>
            </span>
        </div>
    </div>
</div>

<style>
    .container {
        display: flex;
        flex-flow: column;
        gap: 1em;

        height: 100%;
        margin-top: 0.5em;
        overflow-y: auto;
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
        margin: 1em 1em 0 1em;
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
        max-width: 20em;
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
        margin-top: auto;
        padding-bottom: 0.5em;
        color: white;
        text-align: center;
        background-color: rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
    }

    @media only screen and (max-width: 768px) {
        .licenseAgreement {
            padding-bottom: 4em;
        }
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

    .descriptionClickable pre {
        cursor: pointer;

        /*  needed for firefox to have a valid output */
        --transparency: 100%;
        /**/
        transition: --transparency 0.4s, all 0.4s;
        background: linear-gradient(transparent var(--transparency), #404040);
    }

    .descriptionClickable:hover pre {
        cursor: pointer;
        border: 3px solid var(--accent);
        --transparency:30%;
        -webkit-box-shadow: 0 0 1em rgba(var(--main-text-rgb-values), 0.25);
    }

    .bottom {
        display: flex;
        flex-flow: column wrap;
        align-content: center;
        gap: 2em;
        flex-grow: 1;
    }

    input[type="file"] {
        display: none;
    }
</style>