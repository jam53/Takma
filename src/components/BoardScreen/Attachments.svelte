<script lang="ts">
    import {imageExtensions} from "../../scripts/TakmaDataFolderIO";
    import {getImageUrl} from "../../scripts/GetImageUrl";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {resizeImg} from "../../scripts/ResizeImg";
    import {exists} from "@tauri-apps/api/fs";

    export let cardToSave;

    /**
     * Given a path to a file, this function returns the filename. I.e. it removes the uuid in front of the filename (36 characters) and the path to the file
     * @param pathToFile
     */
    function getFilename(pathToFile: string)
    {
        const filename = pathToFile.split('\\').pop().split('/').pop();
        const uuidRemoved = filename.substring(35);

        return uuidRemoved;
    }

    function getFileExtension(pathToFile: string)
    {
        return pathToFile.split(".").pop();
    }
</script>

{#if cardToSave.attachments.length > 0}
    <hr>
    <div class="titleBar">
        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke-width="2" d="M22,12 C22,12 19.0000009,15.0000004 13.0000004,21.0000004 C6.99999996,27.0000004 -2.00000007,18.0000004 3.99999994,12.0000004 C9.99999996,6.00000037 9,7.00000011 13,3.00000008 C17,-0.999999955 23,4.99999994 19,9.00000005 C15,13.0000002 12.0000004,16.0000007 9.99999995,18.0000004 C7.99999952,20 5,17 6.99999995,15.0000004 C8.99999991,13.0000007 16,6 16,6"></path></svg>
        <span>%%Attachments</span>
    </div>
    <div class="attachmentsHolder">
        {#each cardToSave.attachments as attachment}
            {#await exists(attachment, {dir: SaveLoadManager.getSaveDirectory()})}
            {:then fileExists}
            {#if fileExists && attachment !== ""}
                <div class="attachment">
                    <div class="preview">
                        {#if imageExtensions.includes(getFileExtension(attachment))}
                            {#await getImageUrl(attachment, SaveLoadManager.getSaveDirectory())}
                                <button class="boardButtons">
                                    <span class="loader"></span>
                                </button>
                            {:then imgSrc}
                                <img src={imgSrc} use:resizeImg/>
                            {/await}
                        {:else}
                            {getFileExtension(attachment)}
                        {/if}
                    </div>
                    <div class="titleAndActionsHolder">
                        <p title={getFilename(attachment)}>
                            {getFilename(attachment)}
                        </p>
                        <div class="actionsHolder">
                            <button title="%%Open with default app">
                                <svg fill="currentColor" viewBox="-2 -1 18 18"><path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"></path><path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"></path></svg>
                            </button>
                            <button title="%%Show in folder">
                                <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M13 19h-8a2 2 0 0 1 -2 -2v-11a2 2 0 0 1 2 -2h4l3 3h7a2 2 0 0 1 2 2v4"></path><path d="M16 22l5 -5"></path><path d="M21 21.5v-4.5h-4.5"></path></svg>
                            </button>
                            <button title="%%Copy filepath">
                                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19.564 4.42a.75.75 0 0 0-1.378-.59l-6.75 15.75a.75.75 0 0 0 1.378.59l6.75-15.75ZM7 18.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"></path></svg>
                            </button>
                            <button title="%%Delete attachment" id="deleteButton">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -1 24 24" fill="currentColor">
                                    <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            {/if}
            {/await}
        {/each}
    </div>
    <button class="addAttachmentButton">
        %%Add an attachment
    </button>
{/if}

<style>
    hr {
        border: 1px solid var(--border);
    }

    .titleBar {
        transition: 0.3s;
        display: flex;
        align-items: center;
        gap: 0.5em;
        margin-left: 0.25em;
    }

    .titleBar span {
        font-weight: bold;
        font-size: large;
        padding: 0.25em 0.25em;
        background: none;
        word-break: break-all;
        box-shadow: none;
    }

    .titleBar svg {
        min-width: 1.3em;
        max-width: 1.3em;
    }

    .attachmentsHolder {
        display: flex;
        flex-flow: column;
        gap: 1em;
        padding-top: 0.5em;
    }

    .attachment {
        display: flex;
        height: 5em;
        gap: 1em;
        transition: 0.3s;
        border-radius: 0.25em;
    }

    .preview {
        height: 100%;
        width: 7em;
        border-radius: inherit;
        background-color: var(--border);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        text-transform: uppercase;
        transition: inherit;
        cursor: pointer;
    }

    .preview:hover {
        background-color: var(--unselected-button);
    }

    .preview img {
        width: inherit;
        height: 100%;
        object-fit: cover;
        border-radius: inherit;
        transition: inherit;
    }

    .preview img:hover {
        filter: brightness(80%);
    }

    .titleAndActionsHolder {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }

    .titleAndActionsHolder p {
        text-overflow: ellipsis;
        width: max(min(calc(100vw - 34em), 26em), 13em);
        overflow: hidden;
        margin: 0;
        font-weight: bold;
        white-space: nowrap;
        cursor: pointer;
        transition: 0.2s;
    }

    .titleAndActionsHolder p:hover {
        color: var(--unselected-button)
    }

    .actionsHolder {
        display: flex;
        gap: 0.5em;
    }

    .actionsHolder button {
        cursor: pointer;
        border: none;
        background-color: var(--border);
        transition: 0.3s;
        width: 3.5em;
        height: 3.5em;
        border-radius: 4px;
        padding: 0;
    }

    .actionsHolder button:hover {
        background-color: var(--unselected-button);
    }

    .actionsHolder button svg {
        width: 2em;
        height: 2em;
    }

    #deleteButton:hover {
        background-color: var(--danger);
        color: white;
    }

    .addAttachmentButton {
        margin-top: 1em;
        border: none;
        background: var(--border);
        padding: 0.5em;
        font-size: medium;
        border-radius: 4px;
        transition: 0.3s;
        width: 100%;
        cursor: pointer;
    }

    .addAttachmentButton:hover {
        background: var(--unselected-button);
    }
</style>