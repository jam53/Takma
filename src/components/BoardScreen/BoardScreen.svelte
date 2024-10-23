<script lang="ts">
    import {
        cardFilters,
        dueDatesOverviewPopupIsVisible,
        selectedBoardId, selectedCardId
    } from "../../scripts/stores";
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
    import {onDestroy, onMount} from "svelte";
    import CardDetails from "./CardDetails.svelte";
    import {I18n} from "../../scripts/I18n/I18n";

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

    }

    /**
     * If the user drops a file on the container div, i.e. the background image, this function gets called to replace the background image.
     */
    async function handleContainerFileDrop(droppedFile: String)
    {

        if (imageExtensions.includes(getFileExtension(droppedFile).toLowerCase()))
        {
            let savedPath = await saveAbsoluteFilePathToSaveDirectory(droppedFile, $selectedBoardId);
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

            await removeFileFromSaveDirectory(backgroundImagePath);

            SaveLoadManager.getData().setBoardBackgroundImage($selectedBoardId, pathToImage);

            const imgUrl: string = convertFileSrc(await normalize(SaveLoadManager.getSaveDirectoryPath() + pathToImage));
            document.body.style.backgroundImage = `url('${imgUrl}')`; //Tauri can't display the absolute path to the image, so the convertFileSrc() function returns an url that we can then use here to display the image.
        }
    }

    let lists: ListInterface[] = SaveLoadManager.getData().getBoard($selectedBoardId).lists;
    let dragDisabled = isUserOnMobile();
    let setDragDisabled = (bool) => {
        dragDisabled = bool;
    };

    function isUserOnMobile()
    {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;

        // Regular expression to match various mobile devices
        return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0, 4));
    }

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
        height: calc(100vh - 2em - (2 * 8px)); /* 100vh - navbar height in the `.containingDiv` styleclass in `NavBar.svelte` - (2 * height of the scrollbar at the bottom) */
        display: flex;
        overflow-x: scroll;
        overflow-y: hidden;
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