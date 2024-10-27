<script lang="ts">
    import BoardButton from "./BoardButton.svelte";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import type {Board} from "../../scripts/Board";
    import {searchBarValue, selectedBoardId, selectedCardId} from "../../scripts/Stores.svelte.js";
    import {onMount} from "svelte";
    import startWelcomeScreenOnBoarding from "../../scripts/Onboarding";

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
        if (!SaveLoadManager.getData().onboardingCompleted)
        {
            startWelcomeScreenOnBoarding(boardId => selectedBoardId.value = boardId, cardId => selectedCardId.value = cardId); //In IntroJs we can reference other elements during the onboarding, but if they don't exist yet when we start the onboarding it doesn't work. That is why we start in onMount, once all the UI components are loaded in
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