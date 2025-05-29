<script lang="ts">
    import {
        cardFilters,
        dueDatesOverviewPopupIsVisible, listsSortOrder,
        selectedBoardId, selectedCardId
    } from "../../scripts/Stores.svelte.js";
    import type {Card, List as ListInterface} from "../../scripts/Board";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {
        imageExtensions,
        removeFileFromSaveDirectory,
        saveAbsoluteFilePathToSaveDirectory
    } from "../../scripts/TakmaDataFolderIO";
    import CreateNewList from "./CreateNewList.svelte";
    import List from "./List.svelte";
    import {dndzone} from "svelte-dnd-action";
    import {flip} from "svelte/animate";
    import {onDestroy, onMount, untrack} from "svelte";
    import CardDetails from "./CardDetails.svelte";
    import {I18n} from "../../scripts/I18n/I18n";
    import {toast} from "svelte-sonner";

    let createNewCardElements;
    let createNewListElement;
    onMount(() =>
    {
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

    }

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
    $effect(() => {
        listsSortOrder.value = (a, b) => 0; // Clear sort order of lists when opening a new board
        lists = SaveLoadManager.getData().getBoard(selectedBoardId.value).lists;
    });

    // Gets called when the value of `listsSortOrder` changes.
    $effect(() => {
        lists = untrack(() => lists).sort(listsSortOrder.value);
        SaveLoadManager.getData().setLists(selectedBoardId.value, untrack(() => $state.snapshot(lists)));
    })

    let dragDisabled = $state(SaveLoadManager.getData().isUserOnMobile() ? true : false);
    let setDragDisabled = (bool) => {
        if (SaveLoadManager.getData().isUserOnMobile())
        {
            dragDisabled = true;
        }
        else
        {
            dragDisabled = bool;
        }
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
        cardsToFilter = cardsToFilter
            .filter(card => card.dueDate === null && cardFilters.dueDate === Number.MAX_SAFE_INTEGER || card.dueDate !== null && card.dueDate - Date.now() < cardFilters.dueDate)
            .filter(card => !cardFilters.complete && !cardFilters.incomplete || cardFilters.complete && card.complete || cardFilters.incomplete && !card.complete);

        for (let labelId of cardFilters.labelIds)
        {
            cardsToFilter = cardsToFilter.filter(card => card.labelIds.includes(labelId));
        }

        return cardsToFilter;
    }

    // Used to override the browser's "back" functionality, so the user returns to either board or welcome screen. Depending on if they were previously on the card details or board screen respectively.
    // We achieve this by pushing a state with pushState(), which will be popped when the back button is pressed (triggering a `popstate` event). By detecting this event we can decide whether to return to the board or welcome screen, depending on whether the user was viewing a card or a board.
    history.pushState({}, "");
    const backToBoardOrWelcomeScreen = () => {
        if (selectedCardId.value !== "")
        {
            selectedCardId.value = "";
            history.pushState({}, "");
        }
        else if (selectedBoardId.value !== "")
        {
            selectedBoardId.value = "";
            window.removeEventListener("popstate", backToBoardOrWelcomeScreen);
        }
    };
    window.addEventListener("popstate", backToBoardOrWelcomeScreen);

    let initialAmountOfLists = 0;
    $effect(() => {
        initialAmountOfLists = initialAmountOfLists === 0 ? lists.length : initialAmountOfLists;
    });

    let showLabelsText = $state(false); // Defines whether or not the labels on cards on the board screen should show their text. When `false`, only the color will be shown.
    onMount(() => {
        showLabelsText = SaveLoadManager.getData().showLabelsText;
    });
</script>

<div class="container" title={I18n.t("changeBackgroundImage")} oncontextmenu={handleContainerRightClick}>
    <div title="" class="listsHolder" use:dndzone={{items: lists, type:"list", dropTargetStyle: {}, dragDisabled: dragDisabled}} onconsider={handleDndConsiderLists} onfinalize={handleDndFinalizeLists}>
        {#each lists as list, listIndex (list.id)}
            <div animate:flip={{duration: 300}} style="height: 1em">
            <!-- Setting any non-zero height (e.g. `height: 1em`) prevents a quirky visual bug where lists "jump" downwards when dragged. This happens due to incorrect y-position calculations in svelte-dnd-action when the height is dynamic. Any height value other than 0 will fix the issue. -->
                {#key cardFilters}
                    <List
                        cards={filterCards(list.cards)}
                        onDrop={(newCardsData) => handleCardsFinalize(listIndex, newCardsData)}
                        dragDisabled={dragDisabled}
                        setDragDisabled={setDragDisabled}
                        inTransitionDelay={listIndex < initialAmountOfLists ? listIndex : 0}
                        bind:list={() => lists[listIndex], newList => lists[listIndex] = newList}
                        bind:lists
                        bind:showLabelsText
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
        reloadLists={() => lists = SaveLoadManager.getData().getBoard(selectedBoardId.value).lists}
/>

<style>
    .container {
        /*height: calc(100vh - 4px - 30px - 2em - (2 * 8px) + 0.25em); !* 100vh - the borderwidth in the `.bodyNotMaximized` styleclass in `index.html` - height title bar in the `.titlebar` styleclass in `index.html` - navbar height in the `.containingDiv` styleclass in `NavBar.svelte` - (2 * height of the scrollbar at the bottom) + margin-top of this style class *!*/
        height: calc(100vh - 2em - (2 * 8px) + 0.25em); /* 100vh - navbar height in the `.containingDiv` styleclass in `NavBar.svelte` - (2 * height of the scrollbar at the bottom) + margin-top of this style class */
        display: flex;
        overflow-x: scroll;
        overflow-y: hidden;
        /* Adjust spacing so the drop shadow doesn't get cut off: Adding padding-top creates space inside the element, while a negative margin-top pulls the element up visually without clipping the shadow. */
        padding-top: 0.75em;
        margin-top: -0.75em;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
        background-color: rgba(var(--main-text-rgb-values), 0.1);
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