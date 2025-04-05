<script lang="ts">
    import BoardButton from "./BoardButton.svelte";
    import NewBoardPopup from "./NewBoardPopup.svelte";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import type {Board} from "../../scripts/Board";
    import {searchBarValue, selectedBoardId, selectedCardId} from "../../scripts/Stores.svelte.js";
    import {I18n} from "../../scripts/I18n/I18n";
    import {mount, onMount} from "svelte";
    import startWelcomeScreenOnBoarding from "../../scripts/Onboarding";
    import {saveAbsoluteFilePathToSaveDirectory} from "../../scripts/TakmaDataFolderIO";
    import {join, resolveResource} from "@tauri-apps/api/path";
    import {debug, info} from "@tauri-apps/plugin-log";
    import {slide} from "svelte/transition";

    let lazyLoaded = $state(false); //Wordt op true gezet eenmaal er één NewBoardPopup werd aangemaakt, en alle high res images dus geladen zijn. Raadpleeg de uitleg bij deze variabele in NewBoardPopup voor meer informatie

    let sortBoardFunctions = new Map<string, (board1: Board, board2: Board) => number>([
        ["sortByCreationDateAscending", (a, b) => a.creationDate - b.creationDate],
        ["sortByCreationDateDescending", (a, b) => b.creationDate - a.creationDate],
        ["sortByMostRecentlyOpened", (a, b) => b.lastOpened - a.lastOpened],
        ["sortByLeastRecentlyOpened", (a, b) => a.lastOpened - b.lastOpened],
        ["sortAlphabeticallyAscending", (a, b) => a.title.localeCompare(b.title)],
        ["sortAlphabeticallyDescending", (a, b) => b.title.localeCompare(a.title)],
        ["dontSort", (a, b) => 0]
    ]);

    let boards: Board[] = $state(SaveLoadManager.getData().boards.sort(sortBoardFunctions.get(SaveLoadManager.getData().sortBoardsFunctionName)));
    // Automatically saves the boards when any changes are made + ensures they are in the correct order
    $effect(() => {
        debug("Saving boards");
        SaveLoadManager.getData().boards = $state.snapshot(boards.sort(sortBoardFunctions.get(SaveLoadManager.getData().sortBoardsFunctionName)));
    })

    onMount(async () =>
    {
        await info("Opening welcome screen");
        if (!SaveLoadManager.getData().onboardingCompleted)
        {
            startWelcomeScreenOnBoarding(boardId => selectedBoardId.value = boardId, cardId => selectedCardId.value = cardId); //In IntroJs we can reference other elements during the onboarding, but if they don't exist yet when we start the onboarding it doesn't work. That is why we start in onMount, once all the UI components are loaded in
        }

        if (SaveLoadManager.getData().totalCardsCreated >= 25 && !SaveLoadManager.getData().easterEggBoardAdded)
        { //If the user has created more than 25 cards, add the easter egg board to their savefile
            const boards = SaveLoadManager.getData().boards;

            const easterEggBoard = I18n.t("easterEggBoard");
            easterEggBoard.backgroundImagePath = await saveAbsoluteFilePathToSaveDirectory(await resolveResource("resources/EasterEggBoardBg.webp"), easterEggBoard.id);
            easterEggBoard.lists[0].cards[0].description = easterEggBoard.lists[0].cards[0].description.replace("$|00|$", await join(SaveLoadManager.getSaveDirectoryPath(), "Takma", "Takma.json"));
            easterEggBoard.lists[0].cards[0].description = easterEggBoard.lists[0].cards[0].description.replace("$|01|$", await resolveResource("resources/backgrounds"));


            boards.push(easterEggBoard);
            SaveLoadManager.getData().boards = boards;
            SaveLoadManager.getData().easterEggBoardAdded = true;
        }
    });

    const isFavouriteBoard: (board: Board) => boolean
        = board => board.title.toLowerCase().includes(searchBarValue.value.toLowerCase().trim()) && board.favourite && !board.archived;

    const isRegularBoard: (board: Board) => boolean
        = board => board.title.toLowerCase().includes(searchBarValue.value.toLowerCase().trim()) && !board.favourite && !board.archived;

    const isArchivedBoard: (board: Board) => boolean
        = board => board.title.toLowerCase().includes(searchBarValue.value.toLowerCase().trim()) && board.archived;

    let showArchivedBoards = $state(false);
</script>

{#snippet boardButton(board: Board, boardIndex: number)}
    <BoardButton
        image={board.backgroundImagePath}
        title={board.title}
        bind:board={() => boards[boardIndex], newBoard => {boards[boardIndex] = newBoard;}}
        bind:boards
    />
{/snippet}

<!--Favourited boards-->
{#if boards.some(isFavouriteBoard)}
    <div>
        {#each boards as board, i}
            {#if isFavouriteBoard(board)}
                {@render boardButton(board, i)}
            {/if}
        {/each}
    </div>
    <hr>
{/if}
<!--Non favourited boards-->
<div>
    {#each boards as board, i}
        {#if isRegularBoard(board)}
            {@render boardButton(board, i)}
        {/if}
    {/each}
    <button onclick={() => {mount(NewBoardPopup, {props: {lazyLoaded: lazyLoaded}, target: document.body, intro: true}); lazyLoaded = true;}} class="createButton boardButtons">{I18n.t("createBoard")}</button>
</div>
<!--Archived boards-->
{#if boards.some(isArchivedBoard)}
    <div class="separator"
         onclick={_ => showArchivedBoards = !showArchivedBoards}
    >
        <svg height="1em" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M12.643 15C13.979 15 15 13.845 15 12.5V5H1v7.5C1 13.845 2.021 15 3.357 15zM5.5 7h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1M.8 1a.8.8 0 0 0-.8.8V3a.8.8 0 0 0 .8.8h14.4A.8.8 0 0 0 16 3V1.8a.8.8 0 0 0-.8-.8z"></path></svg>
        <span>
            {showArchivedBoards ? I18n.t("hideArchivedBoards") : I18n.t("showArchivedBoards")}
        </span>
        <svg class={{rotated: showArchivedBoards}} stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"></path></svg>
    </div>
    {#if showArchivedBoards}
        <div out:slide>
            {#each boards as board, i}
                {#if isArchivedBoard(board)}
                    {@render boardButton(board, i)}
                {/if}
            {/each}
        </div>
    {/if}
{/if}

<style>
    div {
        display: flex;
        flex-flow: wrap;
    }

    .createButton {
        color: var(--main-text);
        border: 2px dashed #b4b4b4;
    }
    [data-theme='dark'] .createButton {
        border: 2px dashed #4b4b4b;
    }
    .createButton:hover {
        border: 2px solid var(--accent);
        color: var(--accent);
    }

    :global(.boardButtons) {
        background-color: transparent;
        transition-duration: 0.4s;
        border-radius: 5px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 20px;
        cursor: pointer;
        width: 15em;
        height: 8em;
        margin: 1em;
        background-size: cover;
        border: none;
        padding: 0;
    }
    :global(.boardButtons:hover) {
        scale: 105%;
    }

    hr {
        border: 1px solid var(--border);
        margin: 0 0.6em 0 1.25em;
    }

    .separator {
        display: flex;
        align-items: center;
        text-align: center;
        transition: 0.3s;
        color: var(--unselected-button);
        margin: -0.25em 0.6em -0.25em 1.25em;
        font-size: medium;
        gap: 0.5em;
        cursor: pointer;
    }

    .separator:hover {
        color: var(--selected-button);
    }

    .separator::before,
    .separator::after {
        content: '';
        flex: 1;
        border-bottom: 1.5px solid var(--border);
        transition: 0.3s;
    }

    .separator:hover::before, .separator:hover::after {
        border-bottom: 1.5px solid var(--unselected-button);
    }

    .separator:not(:empty)::before {
        margin-right: .25em;
    }

    .separator:not(:empty)::after {
        margin-left: .25em;
    }

    .separator svg {
        transition: transform 0.3s ease-in-out;
    }

    :global(.rotated) {
        transform: rotate(-180deg);
    }
</style>