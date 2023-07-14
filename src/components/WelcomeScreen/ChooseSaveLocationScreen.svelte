<script lang="ts">
    import {BaseDirectory} from "@tauri-apps/api/fs";

    function setSaveLocation(saveLocation: BaseDirectory)
    {
        localStorage.setItem("saveLocation", saveLocation.toString());
        window.location.href = window.location.href; //Zorgt dat onze app/website refreshed. Anders zouden we op het ChooseSaveLocationScreen.svelte blijven staan omdat svelte niet zal zien dat `{#if localstorage.getItem(“saveLocation”) === null}` werd aangepast in App.svelte
    }

</script>

<h1 class="title">
    %%Where would you like Takma to store its data?
</h1>
<div class="optionsHolder">
    <div class="option" on:click={() => setSaveLocation(BaseDirectory.AppLocalData)}>
        <span class="defaultTag">
            %%Default
        </span>
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

<style>
    .title {
        text-align: center;
        font-size: xxx-large;
    }

    .optionsHolder {
        display: flex;
        justify-content: space-evenly;
        height: 70%;
        align-items: center;
    }

    .defaultTag {
        color: var(--accent);
        text-transform: uppercase;
        position: absolute;
        font-size: small;
        background-color: var(--border);
        padding: 0.35em 0.5em;
        border-radius: 0.5em;
        margin: -4em 0 0 -1.4em;
        transition: 0.4s;
    }

    .option {
        border: 3px solid var(--border);
        border-radius: 1em;
        width: 30vw;
        height: 40vh;
        padding: 1em;
        transition: 0.4s;
        overflow-y: auto;
    }

    ::-webkit-scrollbar-track {
        margin: 0.35em 0;
    }

    .option:hover {
        cursor: pointer;
        border: 3px solid var(--accent);
        background: linear-gradient(transparent 30%, var(--border));
        -webkit-box-shadow: 0 0 1em rgba(var(--main-text-rgb-values), 0.25);
    }

    .option h1 {
        text-transform: capitalize;
        margin-top: 0;
        text-align: center;
    }
</style>