<script lang="ts">
    import {draggingCardOrList, selectedBoardId, selectedCardId} from "../../scripts/stores";
    import type {List as ListInterface} from "../../scripts/Board";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {open} from "@tauri-apps/api/dialog";
    import {getImageUrl} from "../../scripts/GetImageUrl";
    import {imageExtensions, removeFileFromTakmaDataFolder, saveFilePathToDisk, saveFileToDisk} from "../../scripts/TakmaDataFolderIO";
    import CreateNewList from "./CreateNewList.svelte";
    import List from "./List.svelte";
    import {dndzone} from "svelte-dnd-action";
    import {flip} from "svelte/animate";
    import {onMount} from "svelte";
    import CardDetails from "./CardDetails.svelte";

    onMount(() =>
    {
        const createNewCardElements = Array.from(document.querySelectorAll('.newCard'));
        const createNewListElement = document.getElementById('createNewListDiv');

        window.addEventListener("keydown", e =>
        {
            if ((e.key === "Escape" || (e.key === "w" && e.ctrlKey)) && createNewCardElements.every(newCardElement => !newCardElement.classList.contains("newCardCreating")) && !createNewListElement.classList.contains("newListCreating"))
            {// key(s) to close pressed && create new card div styleclass isn't applied i.e. we aren't "creating"/entering a new card title && create new list div styleclass isn't applied i.e. we aren't "creating"/entering a new list title. This means we can close the board window, otherwise we would close the board window, while we might have intended to close the create new card/create new list element.
                $selectedBoardId = "";
                document.body.style.backgroundImage = "";
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
            let backgroundImagePath: string = SaveLoadManager.getData().getBoard($selectedBoardId).backgroundImagePath;

            removeFileFromTakmaDataFolder(backgroundImagePath); //We don't await the deletion of the previous board image. If the previous board image was one of the images included in Takma, it will throw an error when we try to delete the file. Which makes sense since we don't store the included images with Takma on disk, but reference them from within the Takma binary. If we don't await this function however, execution will continue even if the function throws an error.

            SaveLoadManager.getData().setBoardBackgroundImage($selectedBoardId, pathToImage);

            const imgUrl: string = await getImageUrl(pathToImage, SaveLoadManager.getSaveDirectory());
            document.body.style.backgroundImage = `url('${imgUrl}')`; //Tauri can't display the absolute path to the image, so the getImageUrl function returns an url that we can then use here to display the image.
        }
    }

    let lists: ListInterface[] = SaveLoadManager.getData().getBoard($selectedBoardId).lists;
    let dragDisabled = false;
    let setDragDisabled = (bool) => {
        dragDisabled = bool;
    };

    /**
     * This function gets called when we change the order of a list/card by dragging them around. Once the dragging is finalized, this function gets called
     */
    function onFinalDragUpdate(newListsData: ListInterface[])
    {
        lists = newListsData;
        SaveLoadManager.getData().setLists($selectedBoardId, newListsData);
    }

    function handleDndConsiderLists(e)
    {
        $draggingCardOrList = true;
        lists = e.detail.items;
    }

    function handleDndFinalizeLists(e)
    {
        $draggingCardOrList = false;
        onFinalDragUpdate(e.detail.items);
    }

    function handleCardsFinalize(listIndex, newCardsData)
    {
        lists[listIndex].cards = newCardsData;
        onFinalDragUpdate([...lists]);
    }

    function refreshListsFunction()
    {
        lists = SaveLoadManager.getData().getBoard($selectedBoardId).lists;
    }
</script>
<div class="container" title="%%To change the background image, simply right-click or drag and drop a new image here." on:contextmenu={handleContainerRightClick} on:drop|preventDefault={handleContainerFileDrop} on:dragover|preventDefault on:dragenter|preventDefault on:dragleave|preventDefault>
    <div title="" class="listsHolder" use:dndzone={{items: lists, type:"list", dropTargetStyle: {}, dragDisabled: dragDisabled}} on:consider={handleDndConsiderLists} on:finalize={handleDndFinalizeLists}>
        {#each lists as list, listIndex (list.id)}
            <div animate:flip={{duration: 300}}>
                <List listId={list.id} cards={list.cards} onDrop={(newCardsData) => handleCardsFinalize(listIndex, newCardsData)} dragDisabled={dragDisabled} setDragDisabled={setDragDisabled} inTransitionDelay={listIndex} refreshListsFunction={refreshListsFunction}/>
            </div>
        {/each}
        <div on:mouseenter={() => setDragDisabled(true)}>
            <CreateNewList refreshListsFunction={refreshListsFunction}/>
        </div>
    </div>
</div>
<CardDetails refreshListsFunction={refreshListsFunction}/>

<style>
    .container {
        height: calc(100vh - 4px - 30px - 2em - (2 * 8px)); /* 100vh - the borderwidth in the `.bodyNotMaximized` styleclass in `index.html` - height title bar in the `.titlebar` styleclass in `index.html` - navbar height in the `.containingDiv` styleclass in `NavBar.svelte` - (2 * height of the scrollbar at the bottom) */
        display: flex;
        overflow-x: scroll;
        overflow-y: hidden;
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