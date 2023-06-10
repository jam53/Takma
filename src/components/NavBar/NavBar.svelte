<script lang="ts">
    import takmaIcon from "../../images/Takma.svg"
    import ThemeToggleButton from "./ThemeToggleButton.svelte";
    import {selectedBoardId} from "../../scripts/stores";
    import SearchBar from "./SearchBar.svelte";
    import Filter from "./Filter.svelte";
    import DeleteBoardButton from "./DeleteBoardButton.svelte";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
</script>

<div class="containingDiv">
    <div class="leftSideContainer">
        <img on:click={() => $selectedBoardId = ""} src={takmaIcon} alt="Takma logo" class="takmaLogo"/>
<!--        We zetten de $boardSelected store op een lege string. Dit betekent dat ons programma dan zal teruggaan naar het welcomeScreen. Hierop klikken heeft dus een soort van back to home effect-->
        {#if $selectedBoardId === ""}
            <h1>Takma</h1>
        {:else}
            <input value={SaveLoadManager.getData().getBoard($selectedBoardId).title} on:input={e => SaveLoadManager.getData().setBoardTitle($selectedBoardId, e.target.value)}/>
        {/if}
    </div>
    <div class="rightSideContainer">
        <SearchBar/>
        {#if $selectedBoardId !== ""}
            <Filter/>
            <DeleteBoardButton/>
        {/if}
        <button class="settingsButton">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="settingsImage">
                <path fill-rule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clip-rule="evenodd" />
            </svg>
        </button>
        <ThemeToggleButton/>
    </div>
</div>

<style>
    .containingDiv {
        display: flex;
        flex-flow: row nowrap;
        align-items: center;
        justify-content: space-between;
        height: 2em;
    }

    .leftSideContainer {
        height: inherit;
        display: flex;
        align-items: center;
        gap: 0.5em;
    }

    h1 {
        font-family: Nunito, sans-serif;
    }

    .takmaLogo {
        height: inherit;
        cursor: pointer;
        transition: 0.3s;
    }

    .takmaLogo:hover {
        transform: scale(105%);
    }

    .rightSideContainer {
        display: flex;
        flex-flow: row nowrap;
        align-items: center;
        justify-content: space-between;
        height: inherit;
        gap: 0.5em;
    }

    .settingsButton {
        height: inherit;
        width: auto;
        margin: 0;
        background-color: transparent;
        padding: 0;
        border: none;
    }

    .settingsImage {
        transition: 0.5s;
        height: inherit;
        cursor: pointer;
        fill: var(--unselected-buton);
    }

    .settingsImage:hover {
        fill: var(--selected-button);
    }
</style>