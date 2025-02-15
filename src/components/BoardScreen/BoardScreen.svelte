<script lang="ts">
    import {
        cardFilters,
        dueDatesOverviewPopupIsVisible,
        selectedBoardId, selectedCardId
    } from "../../scripts/Stores.svelte.js";
    import type {Card, List as ListInterface} from "../../scripts/Board";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {open} from "@tauri-apps/plugin-dialog";
    import {
        imageExtensions,
        removeFileFromSaveDirectory,
        saveAbsoluteFilePathToSaveDirectory
    } from "../../scripts/TakmaDataFolderIO";
    import CreateNewList from "./CreateNewList.svelte";
    import List from "./List.svelte";
    import {dndzone} from "svelte-dnd-action";
    import {flip} from "svelte/animate";
    import {onDestroy, onMount} from "svelte";
    import CardDetails from "./CardDetails.svelte";
    import {I18n} from "../../scripts/I18n/I18n";
    import {convertFileSrc} from "@tauri-apps/api/core";
    import {listen} from "@tauri-apps/api/event";
    import {join} from "@tauri-apps/api/path";
    import {readDir, remove} from "@tauri-apps/plugin-fs";
    import {toast} from "svelte-sonner";
    import {info} from "@tauri-apps/plugin-log";

    let createNewCardElements;
    let createNewListElement
    onMount(() =>
    {
        info("Opening board: " + selectedBoardId.value);
        createNewCardElements = Array.from(document.querySelectorAll('.newCard'));
        createNewListElement = document.getElementById('createNewListDiv');

        window.addEventListener("keydown", listenToKeyDown);
    });

    function listenToKeyDown(e: KeyboardEvent)
    {
        if ((e.key === "Escape" || (e.key.toLowerCase() === "w" && e.ctrlKey)) && createNewCardElements.every(newCardElement => !newCardElement.classList.contains("newCardCreating")) && !createNewListElement.classList.contains("newListCreating") && SaveLoadManager.getData().onboardingCompleted && !dueDatesOverviewPopupIsVisible.value)
        {// key(s) to close pressed && create new card div styleclass isn't applied i.e. we aren't "creating"/entering a new card title && create new list div styleclass isn't applied i.e. we aren't "creating"/entering a new list title. This means we can close the board window, otherwise we would close the board window, while we might have intended to close the create new card/create new list element.
            selectedBoardId.value = "";
            cardFilters.labelIds = [];
            cardFilters.dueDates = [];
        }
        else if ((e.key === "Escape" || (e.key.toLowerCase() === "w" && e.ctrlKey)) && !SaveLoadManager.getData().onboardingCompleted)
        {
            toast(I18n.t("shortcutNotAvailableDuringOnboarding"));
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
            let savedFilePath = await saveAbsoluteFilePathToSaveDirectory(selectedFile, selectedBoardId.value); //We save the selected image by the user to Takma's data folder, this way we can still access it even if the original file is deleted/moved
            await setBoardBackgroundImage(savedFilePath);
        }
    }

    let unlisten;
    (async () => {unlisten = await listen('tauri://drag-drop', async event => {
        if (selectedCardId.value == "") //We only want to react to this filedrop event if there isn't a card selected. Otherwise it would mean the drop event was meant to drop attachements onto a card. Rather than to change the background image of the board.
        {
            await handleContainerFileDrop(event.payload.paths[0]);
        }
    })})();
    onDestroy(() => {
        unlisten();
    });

    /**
     * If the user drops a file on the container div, i.e. the background image, this function gets called to replace the background image.
     */
    async function handleContainerFileDrop(droppedFile: String)
    {

        if (imageExtensions.includes(droppedFile.getFileExtension().toLowerCase()))
        {
            let savedPath = await saveAbsoluteFilePathToSaveDirectory(droppedFile, selectedBoardId.value);
            await setBoardBackgroundImage(savedPath);
        }
    }

    async function setBoardBackgroundImage(pathToImage: string)
    {
        if (pathToImage != undefined)
        {
            let backgroundImagePath: string = SaveLoadManager.getData().getBoard(selectedBoardId.value).backgroundImagePath;

            await removeFileFromSaveDirectory(backgroundImagePath);

            SaveLoadManager.getData().setBoardBackgroundImage(selectedBoardId.value, pathToImage);

            const imgUrl: string = convertFileSrc(await join(SaveLoadManager.getSaveDirectoryPath(), pathToImage));
            document.body.style.backgroundImage = `url('${imgUrl.replace(/'/g, "\\'")}')`; //Tauri can't display the absolute path to the image, so the convertFileSrc() function returns an url that we can then use here to display the image.
        }
    }

    let lists: ListInterface[] = $state([]); // The actual data is loaded via the $effect below.
    // This $effect ensures that the 'lists' variable is automatically updated whenever the 'selectedBoardId' changes.
    // This is crucial for scenarios where the board screen is already open, but the user navigates to a different board (e.g., by clicking a Takma link).
    // In such cases, the $effect will re-run, fetching the correct lists for the newly selected board and triggering a re-render of the component.
    $effect(() =>
    {
        lists = SaveLoadManager.getData().getBoard(selectedBoardId.value).lists;
    });
    let dragDisabled = $state(false);
    let setDragDisabled = (bool) => {
        dragDisabled = bool;
    };

    /**
     * This function gets called when we change the order of a list/card by dragging them around. Once the dragging is finalized, this function gets called
     */
    function onFinalDragUpdate(newListsData: ListInterface[])
    {
        lists = newListsData;
        SaveLoadManager.getData().setLists(selectedBoardId.value, $state.snapshot(newListsData));
    }

    function handleDndConsiderLists(e)
    {
        lists = e.detail.items;
    }

    function handleDndFinalizeLists(e)
    {
        onFinalDragUpdate(e.detail.items);
    }

    function handleCardsFinalize(listIndex, newCardsData)
    {
        lists[listIndex].cards = newCardsData;
        onFinalDragUpdate([...lists]);
    }

    function filterCards(cardsToFilter: Card[]): Card[]
    {
        for (let dueDate of cardFilters.dueDates)
        {
            cardsToFilter = cardsToFilter.filter(card => card.dueDate !== null && parseInt(card.dueDate) - Date.now() < dueDate);
        }

        for (let labelId of cardFilters.labelIds)
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
        const filesOnDisk = await readDir(await join(SaveLoadManager.getSaveDirectoryPath(), SaveLoadManager.getBoardFilesDirectory(), selectedBoardId.value), {recursive: false}) //All of the files in the directory associated with this board
        const boardFiles = await SaveLoadManager.getData().getAllFilesRelatedToBoard(selectedBoardId.value);

        for (const fileOnDisk of filesOnDisk.map(file => file.name))
        {
            if (fileOnDisk && !boardFiles.includes(fileOnDisk))
            {
                await remove(await join(SaveLoadManager.getSaveDirectoryPath(), SaveLoadManager.getBoardFilesDirectory(), selectedBoardId.value, fileOnDisk));
            }
        }
    }
    removeDanglingAttachments();
</script>

<div class="container" title={I18n.t("changeBackgroundImage")} oncontextmenu={handleContainerRightClick}>
    <div title="" class="listsHolder" use:dndzone={{items: lists, type:"list", dropTargetStyle: {}, dragDisabled: dragDisabled}} onconsider={handleDndConsiderLists} onfinalize={handleDndFinalizeLists}>
        {#each lists as list, listIndex (list.id)}
            <div animate:flip={{duration: 300}}>
                {#key cardFilters}
                    <List
                        listId={list.id}
                        cards={filterCards(list.cards)}
                        onDrop={(newCardsData) => handleCardsFinalize(listIndex, newCardsData)}
                        dragDisabled={dragDisabled}
                        setDragDisabled={setDragDisabled}
                        inTransitionDelay={listIndex}
                        bind:list={() => lists[listIndex], newList => lists[listIndex] = newList}
                        bind:lists
                    />
                {/key}
            </div>
        {/each}
        <div onmouseenter={() => setDragDisabled(true)}>
            <CreateNewList bind:lists/>
        </div>
    </div>
</div>
<CardDetails
        refreshList={(newList) => {
            const listIndex = lists.findIndex(list => list.id === newList.id);
            lists[listIndex] = newList;
        }}
        refreshCard={(cardToRefresh) => {
            for (let list of lists)
            {
                for (let [cardIndex, card] of list.cards.entries())
                {
                    if (card.id === cardToRefresh?.id)
                    {
                        list.cards[cardIndex] = cardToRefresh ?? list.cards[cardIndex];
                        return;
                    }
                }
            }
        }}
/>

<style>
    .container {
        height: calc(100vh - 4px - 30px - 2em - (2 * 8px) + 0.25em); /* 100vh - the borderwidth in the `.bodyNotMaximized` styleclass in `index.html` - height title bar in the `.titlebar` styleclass in `index.html` - navbar height in the `.containingDiv` styleclass in `NavBar.svelte` - (2 * height of the scrollbar at the bottom) + margin-top of this style class */
        display: flex;
        overflow-x: scroll;
        overflow-y: hidden;
        padding-top: 0.75em;
        margin-top: -0.25em;
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