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
    import {normalize, resolveResource} from "@tauri-apps/api/path";
    import {info} from "@tauri-apps/plugin-log";

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
    const updateWelcomeScreen = () => boards = SaveLoadManager.getData().boards.sort(sortBoardFunctions.get(SaveLoadManager.getData().sortBoardsFunctionName));

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
            easterEggBoard.lists[0].cards[0].description = easterEggBoard.lists[0].cards[0].description.replace("$|00|$", await normalize(SaveLoadManager.getSaveDirectoryPath() + "/"));
            easterEggBoard.lists[0].cards[0].description = easterEggBoard.lists[0].cards[0].description.replace("$|01|$", await resolveResource("resources/backgrounds"));


            boards.push(easterEggBoard);
            SaveLoadManager.getData().boards = boards;
            SaveLoadManager.getData().easterEggBoardAdded = true;
        }
    });
</script>

{#snippet boardButton(board: Board)}
    <BoardButton
        image={board.backgroundImagePath}
        title={board.title}
        boardId={board.id}
        favourite={board.favourite}
        updateWelcomeScreenFunction={updateWelcomeScreen}
    />
{/snippet}

<div>
<!--Favourited boards-->
    {#each boards as board}
        {#if board.title.toLowerCase().includes(searchBarValue.value.toLowerCase().trim()) && board.favourite}
            {@render boardButton(board)}
        {/if}
    {/each}
</div>
{#if boards.some(board => board.favourite)}
    <hr>
{/if}
<div>
<!--Non favourited boards-->
    {#each boards as board}
        {#if board.title.toLowerCase().includes(searchBarValue.value.toLowerCase().trim()) && !board.favourite}
            {@render boardButton(board)}
        {/if}
    {/each}
    <button onclick={() => {mount(NewBoardPopup, {props: {lazyLoaded: lazyLoaded}, target: document.body, intro: true}); lazyLoaded = true;}} class="createButton boardButtons">{I18n.t("createBoard")}</button>
</div>

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
</style>