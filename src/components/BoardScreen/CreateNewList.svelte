<script lang="ts">
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {selectedBoardId} from "../../scripts/Stores.svelte.js";
    import {clickOutside} from "../../scripts/ClickOutside";
    import {slide} from "svelte/transition";
    import {I18n} from "../../scripts/I18n/I18n";
    import type {List} from "../../scripts/Board";

    interface Props {
        lists: List[],
    }

    let { lists = $bindable() }: Props = $props();

    function handleKeyDown(e: KeyboardEvent)
    {
        e.stopPropagation();
        if (e.key === "Enter")
        {
            openCreateNewList();
        }

        if ((e.key === "Escape" || (e.key.toLowerCase() === "w" && e.ctrlKey)) && createNewListDiv.classList.contains("newListCreating"))
        {// key(s) to close pressed && create new list div styleclass is applied i.e. we are "creating"/entering a new list title
            closeCreateNewList();
        }
    }

    let createNewListDiv: HTMLElement = $state();
    let newListTitleInput: HTMLElement = $state();
    let newListTitleValue = $state("");
    function createNewList(e?: Event)
    {
        e?.stopPropagation();
        let createdListId = SaveLoadManager.getData().createNewList(selectedBoardId.value, newListTitleValue);
        lists.push(SaveLoadManager.getData().getList(selectedBoardId.value, createdListId));

        newListTitleValue = ""; //When we just created a list, the createNewList "screen" will still be open in case the user wants to create another list. But we don't want the title of the list we just created to still be present in the input component, hence why we set the value of the input component to ""
    }

    /**
     * Upon clicking on the "Add another list" div, we apply the "newListCreating" div to the styleclass. This hides the "+ Add another list" text and reveals the input field + add/close buttons
     */
    function openCreateNewList()
    {
        createNewListDiv.classList.add("newListCreating");
        newListTitleInput.focus();
    }

    /**
     * This does the opposite of openCreateNewList() and hides the input field + add/close buttons and reveals the "+ Add another list" text again
     */
    function closeCreateNewList(e?: MouseEvent)
    {
        e?.stopPropagation();
        createNewListDiv.classList.remove("newListCreating");
    }
</script>

<div id="createNewListDiv" class="newList" bind:this={createNewListDiv} onclick={openCreateNewList} use:clickOutside onclick_outside={closeCreateNewList} in:slide|global={{delay: 100 + ((SaveLoadManager.getData().getBoard(selectedBoardId.value)).lists.length * 100)}} tabindex="0" onkeydown={handleKeyDown}>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
    <span>
        {I18n.t("addAnotherList")}
    </span>
    <!--     The things above this line are only displayed when the `newListCreating` styleclass isn't applied. The elements below this line are only displayed when the `newListCreating` styleclass is applied       -->
    <input bind:this={newListTitleInput} bind:value={newListTitleValue} spellcheck="false" onkeydown={e => e.key === "Enter" && createNewList()} placeholder={I18n.t("enterListTitle")}>
    <div>
        <button onclick={createNewList}>
            {I18n.t("addList")}
        </button>
        <svg onclick={closeCreateNewList} xmlns="http://www.w3.org/2000/svg" viewBox="2 2 20 20" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    </div>
</div>

<style>
    .newList {
        background-color: rgba(var(--background-color-rgb-values), 0.3);
        backdrop-filter: blur(10px);
        border-radius: 4px;
        padding: 0.75em 0.5em;
        transition: 0.4s;
        color: var(--main-text);
        width: 16em;
        border: 1px solid rgba(var(--background-color-rgb-values), 0.4);
        display: flex;
        box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
    }

    .newList:hover {
        cursor: pointer;
        background-color: rgba(var(--background-color-rgb-values), 0.6);
        box-shadow: 0 0 1em rgba(var(--main-text-rgb-values), 0.5);
    }

    .newList svg {
        width: 1em;
        padding-right: 0.5em;
    }

    .newList input, .newList button {
        display: none;
    }

    :global(.newListCreating) { /* If we don't add the :global() then this styleclass gets stripped from the build because "it isn't used" */
        background-color: var(--background-color) !important;
        text-decoration: none !important;
        display: flex !important;
        flex-flow: column !important;
        gap: 1em !important;
        padding: 0.5em !important;
    }

    :global(.newListCreating:hover) {
        cursor: auto !important;
        background-color: var(--background-color) !important;
    }

    :global(.newListCreating input, .newListCreating button) {
        display: unset !important;
    }

    :global(.newListCreating svg, .newListCreating span) {
        display: none;
    }

    :global(.newListCreating input) {
        border: 2px solid var(--accent);
        border-radius: 3px;
        box-shadow: none;
        padding: 0.5em;
    }

    :global(.newListCreating div) {
        display: flex;
        justify-content: space-between;
        align-items: center;
        align-content: center;
    }

    :global(.newListCreating div button) {
        height: 2.5em;
        background-color: var(--accent);
        border: none;
        border-radius: 3px;
        font-size: 14px;
        padding: 0.5em;
        color: white;
        transition: 0.2s;
    }

    :global(.newListCreating div button:hover) {
        height: 2.5em;
        background-color: var(--accent-button-hover);
        cursor: pointer;
    }

    :global(.newListCreating div svg) {
        stroke: var(--unselected-button);
        display: unset;
        height: 1.75em;
        width: 1.75em !important;
        transition: 0.2s;
        padding: 0 !important;
    }

    :global(.newListCreating div svg:hover) {
        stroke: var(--selected-button);
        cursor: pointer;
    }
</style>