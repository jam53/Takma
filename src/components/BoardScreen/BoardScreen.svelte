<script lang="ts">
    import {
        cardFilters,
        draggingCardOrList,
        dueDatesOverviewPopupIsVisible,
        selectedBoardId, selectedCardId
    } from "../../scripts/stores";
    import type {Card, List as ListInterface} from "../../scripts/Board";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {open} from "@tauri-apps/api/dialog";
    import {imageExtensions, removeFileFromTakmaDataFolder, saveFilePathToDisk} from "../../scripts/TakmaDataFolderIO";
    import CreateNewList from "./CreateNewList.svelte";
    import List from "./List.svelte";
    import {dndzone} from "svelte-dnd-action";
    import {flip} from "svelte/animate";
    import {onDestroy, onMount} from "svelte";
    import CardDetails from "./CardDetails.svelte";
    import {I18n} from "../../scripts/I18n/I18n";
    import {convertFileSrc} from "@tauri-apps/api/tauri";
    import {listen} from "@tauri-apps/api/event";
    import {readDir, removeFile} from "@tauri-apps/api/fs";

    let createNewCardElements;
    let createNewListElement
    onMount(() =>
    {
        createNewCardElements = Array.from(document.querySelectorAll('.newCard'));
        createNewListElement = document.getElementById('createNewListDiv');

        window.addEventListener("keydown", listenToKeyDown);
    });

    function listenToKeyDown(e)
    {
        if ((e.key === "Escape" || (e.key === "w" && e.ctrlKey)) && createNewCardElements.every(newCardElement => !newCardElement.classList.contains("newCardCreating")) && !createNewListElement.classList.contains("newListCreating") && SaveLoadManager.getData().onboardingCompleted && !$dueDatesOverviewPopupIsVisible)
        {// key(s) to close pressed && create new card div styleclass isn't applied i.e. we aren't "creating"/entering a new card title && create new list div styleclass isn't applied i.e. we aren't "creating"/entering a new list title. This means we can close the board window, otherwise we would close the board window, while we might have intended to close the create new card/create new list element.
            $selectedBoardId = "";
            $cardFilters = {labelIds: [], dueDates: []};
        }
    }

    function removeKeyDownListeners()
    {
        window.removeEventListener("keydown", listenToKeyDown);
    }

    onDestroy(() => {
        removeKeyDownListeners();
    });

    /**
     * If the user right clicks on the container div, i.e. the background image, this function gets called to replace the background image.
     */
    async function handleContainerRightClick()
    {
        const selectedFile = await open({
            multiple: false,
            filters: [{
                name: I18n.t("image"),
                extensions: imageExtensions
            }]
        });
        if (selectedFile !== null && typeof(selectedFile) === "string")
        {
            let savedFilePath = await saveFilePathToDisk(selectedFile, $selectedBoardId); //We save the selected image by the user to Takma's data folder, this way we can still access it even if the original file is deleted/moved
            await setBoardBackgroundImage(savedFilePath);
        }
    }

    let unlisten;
    (async () => {unlisten = await listen('tauri://file-drop', async event => {
        if ($selectedCardId == "") //We only want to react to this filedrop event if there isn't a card selected. Otherwise it would mean the drop event was meant to drop attachements onto a card. Rather than to change the background image of the board.
        {
            await handleContainerFileDrop(event.payload[0]);
        }
    })})();
    onDestroy(() => {
        unlisten();
    })

    /**
     * If the user drops a file on the container div, i.e. the background image, this function gets called to replace the background image.
     */
    async function handleContainerFileDrop(droppedFile: String)
    {

        if (imageExtensions.includes(getFileExtension(droppedFile).toLowerCase()))
        {
            let savedPath = await saveFilePathToDisk(droppedFile, $selectedBoardId);
            await setBoardBackgroundImage(savedPath);
        }
    }

    function getFileExtension(pathToFile: string): string
    {
        return pathToFile.split(".").pop();
    }

    async function setBoardBackgroundImage(pathToImage: string)
    {
        if (pathToImage != undefined)
        {
            let backgroundImagePath: string = SaveLoadManager.getData().getBoard($selectedBoardId).backgroundImagePath;

            removeFileFromTakmaDataFolder(backgroundImagePath); //We don't await the deletion of the previous board image. If the previous board image was one of the images included in Takma, it will throw an error when we try to delete the file. Which makes sense since we don't store the included images with Takma on disk, but reference them from within the Takma binary. If we don't await this function however, execution will continue even if the function throws an error.

            SaveLoadManager.getData().setBoardBackgroundImage($selectedBoardId, pathToImage);

            const imgUrl: string = convertFileSrc(await SaveLoadManager.getAbsoluteSaveDirectory() + pathToImage);
            document.body.style.backgroundImage = `url('${imgUrl}')`; //Tauri can't display the absolute path to the image, so the convertFileSrc() function returns an url that we can then use here to display the image.
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

    function filterCards(cardsToFilter: Card[]): Card[]
    {
        for (let dueDate of $cardFilters.dueDates)
        {
            cardsToFilter = cardsToFilter.filter(card => card.dueDate !== null && parseInt(card.dueDate) - Date.now() < dueDate);
        }

        for (let labelId of $cardFilters.labelIds)
        {
            cardsToFilter = cardsToFilter.filter(card => card.labelIds.includes(labelId));
        }

        return cardsToFilter;
    }

    /**
     * Sometimes attachments/the cover image of cards or the background image of the board don't get removed when they are no longer needed.
     * This function loops through all of the files in the directory of the board, and removes all the files which aren't referenced by either the attachments/the cover image of cards in this board, or the background image of this board.
     */
    async function removeDanglingAttachments()
    {
        const filesOnDisk = await readDir(SaveLoadManager.getBoardFilesPath() + $selectedBoardId, {dir: SaveLoadManager.getSaveDirectory(), recursive: false}) //All of the files in the directory associated with this board
        const boardFiles = SaveLoadManager.getData().getAllFilesRelatedToBoard($selectedBoardId);

        for (const fileOnDisk of filesOnDisk.map(file => file.name))
        {
            if (!boardFiles.includes(fileOnDisk))
            {
                await removeFile(`${SaveLoadManager.getBoardFilesPath() + $selectedBoardId}/${fileOnDisk}`, {dir: SaveLoadManager.getSaveDirectory()});
            }
        }
    }
    removeDanglingAttachments();
</script>
<div class="container" title={I18n.t("changeBackgroundImage")} on:contextmenu={handleContainerRightClick} on:dragover|preventDefault on:dragenter|preventDefault on:dragleave|preventDefault>
    <div title="" class="listsHolder" use:dndzone={{items: lists, type:"list", dropTargetStyle: {}, dragDisabled: dragDisabled}} on:consider={handleDndConsiderLists} on:finalize={handleDndFinalizeLists}>
        {#each lists as list, listIndex (list.id)}
            <div animate:flip={{duration: 300}}>
                {#key $cardFilters}
                    <List listId={list.id} cards={filterCards(list.cards)} onDrop={(newCardsData) => handleCardsFinalize(listIndex, newCardsData)} dragDisabled={dragDisabled} setDragDisabled={setDragDisabled} inTransitionDelay={listIndex} refreshListsFunction={refreshListsFunction}/>
                {/key}
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
        background: var(--unselected-button);
    }

    .listsHolder {
        display: flex;
        padding: 0.5em;
        align-items: flex-start;
        gap: 0.75em;
    }
</style>