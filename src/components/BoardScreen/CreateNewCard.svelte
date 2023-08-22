<script lang="ts">
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {selectedBoardId, selectedCardId} from "../../scripts/stores";
    import {afterUpdate, onMount} from "svelte";
    import {clickOutside} from "../../scripts/ClickOutside";
    import {I18n} from "../../scripts/I18n/I18n";

    export let refreshListsFunction; //We call this function when we add a new card to the board. We do so by passing this lambda function to the CreateNewCard component, which then calls this lambda upon making a new card. This function basically overwrites the previous value of the `lists` variable in the board with the new value it gets from `SaveLoadManager.getData().getBoard($selectedBoardId).lists`.
    export let listId; //The id of the list this CreateNewCard component is in
    export let outerWrapperElement; //The outer div which contains the cards and scrollbar. We use this reference to the element to scroll to the bottom when adding a new card

    function handleKeyDown(e)
    {
        if (e.key === "Enter")
        {
            openCreateNewCard();
        }

        if ((e.key === "Escape" || (e.key === "w" && e.ctrlKey)) && createNewCardDiv.classList.contains("newCardCreating"))
        {// key(s) to close pressed && create new card div styleclass is applied i.e. we are "creating"/entering a new card title
            closeCreateNewCard();
        }
    }

    let createNewCardDiv;
    let newCardTitleInput;
    let newCardTitleValue = "";
    function createNewCard()
    {
        SaveLoadManager.getData().createNewCard(newCardTitleValue, $selectedBoardId, listId);
        refreshListsFunction(); //If we don't do this, the UI won't update to show the newly added card because Svelte would have no way of knowing that the contents of the `lists` variable parent component changed to now include this new card.

        newCardTitleValue = ""; //When we just created a card, the createNewCard "screen" will still be open in case the user wants to create another card. But we don't want the title of the card we just created to still be present in the input component, hence why we set the value of the input component to ""

        resizeCardsHolderIfNeeded();
        //outerWrapperElement.scrollTo(0, parseInt(getComputedStyle(outerWrapperElement).maxHeight));
    }

    /**
     * Upon clicking on the "Add a card" div, we apply the "newCardCreating" div to the styleclass. This hides the "+ Add a card" text and reveals the input field + add/close buttons
     */
    function openCreateNewCard()
    {
        createNewCardDiv.classList.add("newCardCreating");
        newCardTitleInput.focus();

        resizeCardsHolderIfNeeded();
    }

    const scrollToBottomOfCardsList = () => outerWrapperElement && (outerWrapperElement.scrollTop = 9999999999999999999999999999999);

    /**
     * This function will reduce the height of the div that holds the cards. We call this function after we add a new card/show the create new card thingy. Because in both cases the list that holds the cards will become longer, which might cause it to be clipped by going off screen.
     */
    function resizeCardsHolderIfNeeded()
    {
        if (createNewCardDiv.classList.contains("newCardCreating") && outerWrapperElement.scrollHeight + createNewCardDiv.clientHeight > parseInt(getComputedStyle(outerWrapperElement).maxHeight)) //If there is a scrollbar already or if the extra height added by clicking on the createNewCard button makes it so the createNewCard thingy goes off-screen, make the outerWrapperElements that contains the cards less high, that way the createNewCard thingy won't go off the screen
        {
            scrollToBottomOfCardsList();
            outerWrapperElement.style.height = `calc(${parseInt(getComputedStyle(outerWrapperElement).maxHeight)}px - 3.5em)`;
        }
    }

    afterUpdate(() =>
    {
        if (createNewCardDiv.classList.contains("newCardCreating"))
        {
            scrollToBottomOfCardsList();
        }
    });

    /**
     * This does the opposite of openCreateNewCard() and hides the input field + add/close buttons and reveals the "+ Add a card" text again
     */
    function closeCreateNewCard()
    {
        createNewCardDiv.classList.remove("newCardCreating");
        outerWrapperElement.style.height = "auto";
    }
</script>

<div id="createNewCardDiv" class="newCard" bind:this={createNewCardDiv} on:click={openCreateNewCard} use:clickOutside on:click_outside={closeCreateNewCard} on:contextmenu|stopPropagation on:drop|stopPropagation|preventDefault tabindex="0" on:keydown|stopPropagation={handleKeyDown}>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
    <span>
        {I18n.t("addACard")}
    </span>
    <!--     The things above this line are only displayed when the `newCardCreating` styleclass isn't applied. The elements below this line are only displayed when the `newCardCreating` styleclass is applied       -->
    <input bind:this={newCardTitleInput} bind:value={newCardTitleValue} on:keydown={e => e.key === "Enter" && createNewCard()} placeholder={I18n.t("enterCardTitle")}>
    <div>
        <button on:click|stopPropagation={createNewCard}>
            {I18n.t("addCard")}
        </button>
        <svg on:click|stopPropagation={closeCreateNewCard} xmlns="http://www.w3.org/2000/svg" viewBox="2 2 20 20" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
    </div>
</div>

<style>
    .newCard {
        margin: 0 0.25em 0.25em 0.25em;
        padding: 0.75em 0.5em;
        transition: 0.4s;
        color: var(--main-text);
        display: flex;
        border-radius: 4px;
    }

    .newCard:hover {
        cursor: pointer;
        background-color: rgba(var(--background-color-rgb-values), 0.6);
        -webkit-box-shadow: 0 0 1em rgba(var(--main-text-rgb-values), 0.5);
    }

    .newCard svg {
        width: 1em;
        padding-right: 0.5em;
    }

    .newCard input, .newCard button {
        display: none;
    }

    :is(.newCardCreating) { /* If we don't add the :is() then this styleclass gets stripped from the build because "it isn't used" */
        background-color: var(--background-color);
        -webkit-box-shadow: 0 0 1em rgba(var(--main-text-rgb-values), 0.5);
        text-decoration: none;
        display: flex;
        flex-flow: column;
        gap: 1em;
        padding: 0.5em;
    }

    :is(.newCardCreating:hover) {
        cursor: auto;
        background-color: var(--background-color);
    }

    :is(.newCardCreating input, .newCardCreating button) {
        display: unset;
    }

    :is(.newCardCreating svg, .newCardCreating span) {
        display: none;
    }

    :is(.newCardCreating input) {
        border: 2px solid var(--accent);
        border-radius: 3px;
        box-shadow: none;
        padding: 0.5em;
    }

    :is(.newCardCreating div) {
        display: flex;
        justify-content: space-between;
        align-items: center;
        align-content: center;
    }

    :is(.newCardCreating div button) {
        height: 2.5em;
        background-color: var(--accent);
        border: none;
        border-radius: 3px;
        font-size: 14px;
        padding: 0.5em;
        color: white;
        transition: 0.2s;
    }

    :is(.newCardCreating div button:hover) {
        height: 2.5em;
        background-color: var(--accent-button-hover);
        cursor: pointer;
    }

    :is(.newCardCreating div svg) {
        stroke: var(--unselected-button);
        display: unset;
        height: 1.75em;
        width: 1.75em;
        transition: 0.2s;
        padding: 0;
    }

    :is(.newCardCreating div svg:hover) {
        stroke: var(--selected-button);
        cursor: pointer;
    }
</style>