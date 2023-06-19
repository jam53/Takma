<script lang="ts">
    import {selectedBoardId} from "../../scripts/stores";
    import type {Board} from "../../scripts/Board";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {open} from "@tauri-apps/api/dialog";
    import {getImageUrl} from "../../scripts/GetImageUrl";
    import {imageExtensions, removeFileFromTakmaDataFolder, saveFilePathToDisk, saveFileToDisk} from "../../scripts/TakmaDataFolderIO";
    import {clickOutside} from "../../scripts/ClickOutside";
    import {onMount} from "svelte";
    import {slide} from "svelte/transition";

    let board: Board = SaveLoadManager.getData().getBoard($selectedBoardId); //Even if we change member variables of the board object, we don't need to reassign the board variable. This happens automatically because of Svelte's reactivity. So if we were to change the board's background image for example, using `SaveLoadManager.getData().setBoardBackgroundImage($selectedBoardId, savedFilePath);`. Then this board variable would also automatically be updated

    onMount(() =>
    {
        window.addEventListener("keydown", e => {
            if (createNewListDiv.classList.contains("newListCreating") && (e.key === "Escape" || (e.key === "w" && e.ctrlKey)))
            {
                closeCreateNewList();
            }
        });
    });

    /**
     * If the user right clicks on the container div, i.e. the background image, this function gets called to replace the background image.
     */
    async function handleContainerRightClick()
    {
        const selectedFile = await open({
            multiple: false,
            filters: [{
                name: "%%Image",
                extensions: imageExtensions
            }]
        });
        if (selectedFile !== null && typeof(selectedFile) === "string")
        {
            let savedFilePath = await saveFilePathToDisk(selectedFile, $selectedBoardId); //We save the selected image by the user to Takma's data folder, this way we can still access it even if the original file is deleted/moved
            await setBoardBackgroundImage(savedFilePath);
        }
    }

    /**
     * If the user drops a file on the container div, i.e. the background image, this function gets called to replace the background image.
     */
    async function handleContainerFileDrop(e)
    {
        const droppedFile: File = e.dataTransfer.files[0];

        if (droppedFile.type.includes("image"))
        {
            let savedPath = await saveFileToDisk(droppedFile, $selectedBoardId);
            await setBoardBackgroundImage(savedPath);
        }
    }

    async function setBoardBackgroundImage(pathToImage: string)
    {
        if (pathToImage != undefined)
        {
            removeFileFromTakmaDataFolder(board.backgroundImagePath); //We don't await the deletion of the previous board image. If the previous board image was one of the images included in Takma, it will throw an error when we try to delete the file. Which makes sense since we don't store the included images with Takma on disk, but reference them from within the Takma binary. If we don't await this function however, execution will continue even if the function throws an error.

            SaveLoadManager.getData().setBoardBackgroundImage($selectedBoardId, pathToImage);

            const imgUrl: string = await getImageUrl(board.backgroundImagePath, SaveLoadManager.getSaveDirectory());
            document.body.style.backgroundImage = `url('${imgUrl}')`; //Tauri can't display the absolute path to the image, so the getImageUrl function returns an url that we can then use here to display the image.
        }
    }

    let createNewListDiv;
    let newListTitleInput;
    let newListTitleValue: string;
    function createNewList()
    {
        SaveLoadManager.getData().createNewList($selectedBoardId, newListTitleValue);
        board = board; //If we don't do this, the UI won't update because Svelte would think the values of "board" didn't change.

        newListTitleValue = ""; //When we just created a list, the createNewList thingy will still be open in case the uesr wants to create another list. But we don't want the title of the list we just created to still be there, hence why we set the value of the input to ""
    }

    /**
     * Upon clicking on the "Add another list" div, we apply the "newListCreating" div to the styleclass. This hides the "+ Add another list" text and reveals the input field + add/close buttons
     */
    function openCreateNewList()
    {
        createNewListDiv.classList.add("newListCreating");
        newListTitleInput.focus();
    }

    /**
     * This does the opposite of openCreateNewList() and hides the input field + add/close buttons and reveals the "+ Add another list" text again
     */
    function closeCreateNewList()
    {
        createNewListDiv.classList.remove("newListCreating");
    }

</script>

<div class="container" title="%%To change the background image, simply right-click or drag and drop a new image here." on:contextmenu={handleContainerRightClick} on:drop|preventDefault={handleContainerFileDrop} on:dragover|preventDefault on:dragenter|preventDefault on:dragleave|preventDefault>
    <div title="" class="listsHolder">
        {#each board.lists as list, i}
            <div class="list" in:slide={{delay: i*100}}>
                <span>
                    {list.title}
                </span>
            </div>
        {/each}
        <div class="list newList" bind:this={createNewListDiv} on:click={openCreateNewList} use:clickOutside on:click_outside={closeCreateNewList} in:slide={{delay: 100 + (board.lists.length * 100)}} on:contextmenu|stopPropagation on:drop|stopPropagation|preventDefault>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>
                %%Add another list
            </span>
            <!--     The things above this line are only displayed when the `newListCreating` styleclass isn't applied. The elements below this line are only displayed when the `newListCreating` styleclass is applied       -->
            <input bind:this={newListTitleInput} bind:value={newListTitleValue} on:keydown={e => e.key === "Enter" && createNewList()}>
            <div>
                <button on:click|stopPropagation={createNewList}>
                    %%Add list
                </button>
                <svg on:click|stopPropagation={closeCreateNewList} xmlns="http://www.w3.org/2000/svg" viewBox="2 2 20 20" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
        </div>
    </div>
</div>

<style>
    .container {
        height: calc(100vh - 4px - 30px - 2em - (2 * 10px)); /* 100vh - the borderwidth in the `.bodyNotMaximized` styleclass in `index.html` - height title bar in the `.titlebar` styleclass in `index.html` - navbar height in the `.containingDiv` styleclass in `NavBar.svelte` - (2 * heiht of the scrollbar at the bottom) */
        display: flex;
        overflow: auto;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
        background-color: rgba(var(--background-color-rgb-values), 0.5);
        border-radius: 8px;
    }

    /* Handle on hover */
    ::-webkit-scrollbar-thumb:hover {
        background: var(--unselected-buton);
    }

    .listsHolder {
        display: flex;
        padding: 0.5em;
        align-items: flex-start;
        gap: 0.75em;
    }

    .list {
        background-color: rgba(var(--background-color-rgb-values), 0.2);
        backdrop-filter: blur(10px);
        border-radius: 4px;
        padding: 0.75em 0.5em;
        transition: 0.4s;
        color: var(--main-text);
        width: 16em;
        border: 1px solid rgba(var(--background-color-rgb-values), 0.4);
    }

    .newList {
        display: flex;
    }

    .newList:hover {
        cursor: pointer;
        background-color: rgba(var(--background-color-rgb-values), 0.4);
    }

    .newList svg {
        width: 1em;
        padding-right: 0.5em;
    }

    .newList input, .newList button {
        display: none;
    }

    :is(.newListCreating) { /* If we don't add the :is() then this styleclass gets stripped from the build because "it isn't used" */
        background-color: var(--background-color);
        text-decoration: none;
        display: flex;
        flex-flow: column;
        gap: 1em;
        padding: 0.5em;
    }

    :is(.newListCreating:hover) {
        cursor: auto;
        background-color: var(--background-color);
    }

    :is(.newListCreating input, .newListCreating button) {
        display: unset;
    }

    :is(.newListCreating svg, .newListCreating span) {
        display: none;
    }

    :is(.newListCreating input) {
        border: 2px solid var(--accent);
        border-radius: 3px;
        box-shadow: none;
        padding: 0.5em;
    }

    :is(.newListCreating div) {
        display: flex;
        justify-content: space-between;
        align-items: center;
        align-content: center;
    }

    :is(.newListCreating div button) {
        height: 2.5em;
        background-color: var(--accent);
        border: none;
        border-radius: 3px;
        font-size: 14px;
        padding: 0.5em;
        color: white;
        transition: 0.2s;
    }

    :is(.newListCreating div button:hover) {
        height: 2.5em;
        background-color: var(--accent-button-hover);
        cursor: pointer;
    }

    :is(.newListCreating div svg) {
        stroke: var(--unselected-buton);
        display: unset;
        height: 1.75em;
        width: 1.75em;
        transition: 0.2s;
        padding: 0;
    }

    :is(.newListCreating div svg:hover) {
        stroke: var(--selected-button);
        cursor: pointer;
    }
</style>