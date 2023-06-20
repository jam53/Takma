<script lang="ts">
    import {selectedBoardId} from "../../scripts/stores";
    import type {Board} from "../../scripts/Board";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {open} from "@tauri-apps/api/dialog";
    import {getImageUrl} from "../../scripts/GetImageUrl";
    import {imageExtensions, removeFileFromTakmaDataFolder, saveFilePathToDisk, saveFileToDisk} from "../../scripts/TakmaDataFolderIO";
    import CreateNewList from "./CreateNewList.svelte";
    import List from "./List.svelte";

    let board: Board = SaveLoadManager.getData().getBoard($selectedBoardId);

    const refreshBoard = () => board = SaveLoadManager.getData().getBoard($selectedBoardId); //We call this function for example when we add a new list to the board. We do so by passing this lambda function to the CreateNewList component, which then calls this lambda upon making a new list. When we change a member variable of the `board` variable (by adding a new list e.g.), Svelte thinks the board variable remained unchanged and therefore doesn't update the UI. If we call this lambda function Svelte sees that the value of `board` changed and will render the new list.

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
</script>

<div class="container" title="%%To change the background image, simply right-click or drag and drop a new image here." on:contextmenu={handleContainerRightClick} on:drop|preventDefault={handleContainerFileDrop} on:dragover|preventDefault on:dragenter|preventDefault on:dragleave|preventDefault>
    <div title="" class="listsHolder">
        {#each board.lists as list, i}
            <List listId={list.id} inTransitionDelay={i}/>
        {/each}
        <CreateNewList refreshBoardFunction={refreshBoard}/>
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
</style>