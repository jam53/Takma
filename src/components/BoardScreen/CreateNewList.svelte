<script lang="ts">
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {selectedBoardId, selectedCardId} from "../../scripts/stores";
    import {onMount} from "svelte";
    import {clickOutside} from "../../scripts/ClickOutside";
    import {slide} from "svelte/transition";

    export let refreshListsFunction; //We call this function when we add a new list to the board. We do so by passing this lambda function to the CreateNewList component, which then calls this lambda upon making a new list. This function basically overwrites the previous value of the `lists` variable in the board with the new value it gets from `SaveLoadManager.getData().getBoard($selectedBoardId).lists`.

    onMount(() =>
    {
        window.addEventListener("keydown", e => {
            if ((e.key === "Escape" || (e.key === "w" && e.ctrlKey)) && createNewListDiv.classList.contains("newListCreating"))
            {// key(s) to close pressed && create new list div styleclass is applied i.e. we are "creating"/entering a new list title
                closeCreateNewList();
            }
            else if ((e.key === "Escape" || (e.key === "w" && e.ctrlKey)) && !createNewListDiv.classList.contains("newListCreating") && $selectedCardId != "")
            {// key(s) to close pressed && create new list div styleclass isn't applied i.e. we aren't "creating"/entering a new list title. Otherwise we would want to close that in the if above, rather than closing the card(which is what this if does by setting `selectedCardId to ""`.
                $selectedCardId = "";
            }
            else if ((e.key === "Escape" || (e.key === "w" && e.ctrlKey)) && !createNewListDiv.classList.contains("newListCreating") && $selectedCardId === "")
            {// key(s) to close pressed && create new list div styleclass isn't applied i.e. we aren't "creating"/entering a new list title. Otherwise we would want to close that in the if above, rather than closing the entire board (which is what this if does by setting `$selectedBoardId to ""`. We finally also check if there isn't a card selected, because in that case we would like to close the card, instead of the board
                $selectedBoardId = "";
                document.body.style.backgroundImage = "";
            }
        });
    });

    let createNewListDiv;
    let newListTitleInput;
    let newListTitleValue = "";
    function createNewList()
    {
        SaveLoadManager.getData().createNewList($selectedBoardId, newListTitleValue);
        refreshListsFunction(); //If we don't do this, the UI won't update to show the newly added list because Svelte would have no way of knowing that the values of the `lists` variable parent component should now include this new list.

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
    function closeCreateNewList()
    {
        createNewListDiv.classList.remove("newListCreating");
    }
</script>

<div id="createNewListDiv" class="newList" bind:this={createNewListDiv} on:click={openCreateNewList} use:clickOutside on:click_outside={closeCreateNewList} in:slide|global={{delay: 100 + ((SaveLoadManager.getData().getBoard($selectedBoardId)).lists.length * 100)}} on:contextmenu|stopPropagation on:drop|stopPropagation|preventDefault>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
    <span>
        %%Add another list
    </span>
    <!--     The things above this line are only displayed when the `newListCreating` styleclass isn't applied. The elements below this line are only displayed when the `newListCreating` styleclass is applied       -->
    <input bind:this={newListTitleInput} bind:value={newListTitleValue} on:keydown={e => e.key === "Enter" && createNewList()}>
    <div>
        <button on:click|stopPropagation={createNewList}>
            %%Add list
        </button>
        <svg on:click|stopPropagation={closeCreateNewList} xmlns="http://www.w3.org/2000/svg" viewBox="2 2 20 20" stroke-width="1.5">
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
        -webkit-box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
    }

    .newList:hover {
        cursor: pointer;
        background-color: rgba(var(--background-color-rgb-values), 0.6);
        -webkit-box-shadow: 0 0 1em rgba(var(--main-text-rgb-values), 0.5);
    }

    .newList svg {
        width: 1em;
        padding-right: 0.5em;
    }

    .newList input, .newList button {
        display: none;
    }

    :is(.newListCreating) { /* If we don't add the :is() then this styleclass gets stripped from the build because "it isn't used" */
        background-color: var(--background-color);
        text-decoration: none;
        display: flex;
        flex-flow: column;
        gap: 1em;
        padding: 0.5em;
    }

    :is(.newListCreating:hover) {
        cursor: auto;
        background-color: var(--background-color);
    }

    :is(.newListCreating input, .newListCreating button) {
        display: unset;
    }

    :is(.newListCreating svg, .newListCreating span) {
        display: none;
    }

    :is(.newListCreating input) {
        border: 2px solid var(--accent);
        border-radius: 3px;
        box-shadow: none;
        padding: 0.5em;
    }

    :is(.newListCreating div) {
        display: flex;
        justify-content: space-between;
        align-items: center;
        align-content: center;
    }

    :is(.newListCreating div button) {
        height: 2.5em;
        background-color: var(--accent);
        border: none;
        border-radius: 3px;
        font-size: 14px;
        padding: 0.5em;
        color: white;
        transition: 0.2s;
    }

    :is(.newListCreating div button:hover) {
        height: 2.5em;
        background-color: var(--accent-button-hover);
        cursor: pointer;
    }

    :is(.newListCreating div svg) {
        stroke: var(--unselected-buton);
        display: unset;
        height: 1.75em;
        width: 1.75em;
        transition: 0.2s;
        padding: 0;
    }

    :is(.newListCreating div svg:hover) {
        stroke: var(--selected-button);
        cursor: pointer;
    }
</style>