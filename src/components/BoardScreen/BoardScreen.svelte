<script lang="ts">
    import {selectedBoardId} from "../../scripts/stores";
    import type {Board} from "../../scripts/Board";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {open} from "@tauri-apps/api/dialog";
    import {getImageUrl} from "../../scripts/GetImageUrl";
    import {imageExtensions, removeFileFromTakmaDataFolder, saveFilePathToDisk, saveFileToDisk} from "../../scripts/TakmaDataFolderIO";

    const board: Board = SaveLoadManager.getData().getBoard($selectedBoardId); //Even if we change member variables of the board object, we don't need to reassign the board variable. This happens automatically because of Svelte's reactivity. So if we were to change the board's background image for example, using `SaveLoadManager.getData().setBoardBackgroundImage($selectedBoardId, savedFilePath);`. Then this board variable would also automatically be updated

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
    <div on:contextmenu|stopPropagation on:drop|stopPropagation|preventDefault>
        <h1>Board screen</h1>
    </div>
</div>

<style>
    .container {
        height: 100%;
    }
</style>