<script lang="ts">
    import {BaseDirectory} from "@tauri-apps/api/fs";
    import {open} from "@tauri-apps/api/shell";
    import {resolveResource} from "@tauri-apps/api/path";

    function setSaveLocation(saveLocation: BaseDirectory)
    {
        localStorage.setItem("saveLocation", saveLocation.toString());
        location.reload(); //Zorgt dat onze app/website refreshed. Anders zouden we op het ChooseSaveLocationScreen.svelte blijven staan omdat svelte niet zal zien dat `{#if localstorage.getItem(“saveLocation”) === null}` werd aangepast in App.svelte
    }

</script>

<h1 class="title">
    %%Where would you like Takma to store its data?
</h1>
<div class="optionsHolder">
    <div>
        <span class="defaultTag">
            %%Default
        </span>
        <div class="option" on:click={() => setSaveLocation(BaseDirectory.AppLocalData)}>
            <h1>
                %%Local App Data
            </h1>
            <p>
                %%Takma will save its data in the localappdata folder on your PC.
            </p>
            <p>
                %%This is the recommended option if you're unsure or have no preference.
            </p>
        </div>
    </div>
    <div>
        <span class="defaultTag" style="visibility: hidden">
            %%Default
        </span>
        <div class="option" on:click={() => setSaveLocation(BaseDirectory.Document)}>
            <h1>
                %%My Documents
            </h1>
            <p>
                %%Takma will save its data to your My Documents folder.
            </p>
            <p>
                %%This option is recommended if you have OneDrive set up, as the contents of the folder get synced across multiple PCs. Hence, choosing this option ensures that your Takma data is easily accessible and synchronized across different computers.
            </p>
        </div>
    </div>
</div>
<div class="licenseAgreement">
    <span>
        By proceeding, you indicate your acceptance of the terms and conditions outlined in the <a on:click={async () => open((await resolveResource("resources/LICENSE.txt")).substring(4))}>license agreement.</a>
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
        transition: 0.4s;
        overflow-y: auto;
        background-color: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(10px);
    }

    ::-webkit-scrollbar-track {
        margin: 0.35em 0;
    }

    .option:hover {
        cursor: pointer;
        border: 3px solid var(--accent);
        background: linear-gradient(transparent 30%, #404040);
        -webkit-box-shadow: 0 0 1em rgba(var(--main-text-rgb-values), 0.25);
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
    }

    .licenseAgreement span {
        background-color: rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
        border-radius: 1em;
    }

    .licenseAgreement span a {
        color: var(--accent);
        text-decoration: underline;
        cursor: pointer;
    }
</style>