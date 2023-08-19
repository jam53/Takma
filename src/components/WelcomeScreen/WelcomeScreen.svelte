<script lang="ts">
    import BoardButton from "./BoardButton.svelte";
    import NewBoardPopup from "./NewBoardPopup.svelte";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import type {Board} from "../../scripts/Board";
    import {searchBarValue, selectedBoardId} from "../../scripts/stores";

    let lazyLoaded = false; //Wordt op true gezet eenmaal er één NewBoardPopup werd aangemaakt, en alle high res images dus geladen zijn. Raadpleeg de uitleg bij deze variabele in NewBoardPopup voor meer informatie

    let sortBoardFunctions = new Map<string, (board1: Board, board2: Board) => number>([
        ["sortByCreationDateAscending", (a, b) => a.creationDate - b.creationDate],
        ["sortByCreationDateDescending", (a, b) => b.creationDate - a.creationDate],
        ["sortByMostRecentlyOpened", (a, b) => b.lastOpened - a.lastOpened],
        ["sortByLeastRecentlyOpened", (a, b) => a.lastOpened - b.lastOpened],
        ["sortAlphabeticallyAscending", (a, b) => a.title.localeCompare(b.title)],
        ["sortAlphabeticallyDescending", (a, b) => b.title.localeCompare(a.title)],
        ["dontSort", (a, b) => 0]
    ]);

    let boards: Board[] = SaveLoadManager.getData().boards.sort(sortBoardFunctions.get(SaveLoadManager.getData().sortBoardsFunctionName));
</script>

<div>
    <button on:click={() => {new NewBoardPopup({target: document.body, props: {lazyLoaded: lazyLoaded}, intro: true}); lazyLoaded = true;}} class="createButton boardButtons">%%Create</button>
    {#each boards as board}
        {#if board.title.includes($searchBarValue.trim())}
            <BoardButton
                on:clicked={() => {
                    $selectedBoardId = board.id;
                    SaveLoadManager.getData().setBoardLastOpenedTime($selectedBoardId);
                }}
                image={board.backgroundImagePath}
                title={board.title}
            />
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
</style>