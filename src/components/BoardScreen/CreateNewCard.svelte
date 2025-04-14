<script lang="ts">
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {selectedBoardId} from "../../scripts/Stores.svelte.js";
    import {onMount} from "svelte";
    import {clickOutside} from "../../scripts/ClickOutside";
    import {I18n} from "../../scripts/I18n/I18n";
    import type {List} from "../../scripts/Board";

    interface Props {
        list: List,
        outerWrapperElement: HTMLElement;
    }

    let { list = $bindable(), outerWrapperElement = $bindable() }: Props = $props();

    function handleKeyDown(e: KeyboardEvent)
    {
        e.stopPropagation();
        if (e.key === "Enter")
        {
            openCreateNewCard();
        }

        if ((e.key === "Escape" || (e.key.toLowerCase() === "w" && e.ctrlKey)) && createNewCardDiv.classList.contains("newCardCreating"))
        {// key(s) to close pressed && create new card div styleclass is applied i.e. we are "creating"/entering a new card title
            closeCreateNewCard();
        }
    }

    let createNewCardDiv: HTMLElement = $state();
    let newCardTitleInput: HTMLElement = $state();
    let newCardTitleValue = $state("");
    function createNewCard(e?: Event)
    {
        e?.stopPropagation();
        SaveLoadManager.getData().createNewCard(newCardTitleValue, selectedBoardId.value, list.id);
        list = SaveLoadManager.getData().getList(selectedBoardId.value, list.id);

        newCardTitleValue = ""; //When we just created a card, the createNewCard "screen" will still be open in case the user wants to create another card. But we don't want the title of the card we just created to still be present in the input component, hence why we set the value of the input component to ""

        resizeCardsHolderIfNeeded();
        executeCallbackOnElementSizeChange(outerWrapperElement.children[0], scrollToBottomOfCardsList); //The first child of this `outerWrapperElement` is supposed to be the container that holds all of the cards. I.e. the container that will change in height once a new card has been added
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
        if (createNewCardDiv.classList.contains("newCardCreating") && outerWrapperElement.scrollHeight + createNewCardDiv.clientHeight - createNewDivInitialHeight > parseInt(getComputedStyle(outerWrapperElement).maxHeight)) //If there is a scrollbar already or if the extra height added by clicking on the createNewCard button makes it so the createNewCard thingy goes off-screen, make the outerWrapperElements that contains the cards less high, that way the createNewCard thingy won't go off the screen
            //or in other words: if (we are creating a new card && height of the div that holds the cards + the height of our createNewCardDiv (the createNewCardDiv when entering a new card title) - height of the createNewCardDiv (the createNewCardDiv that's visible by default, if we click on it we apply different styleclasses and get the createNewCardDiv where we enter the card title. The height of this default createNewCardDiv is included in the height of the div that holds the cards though, hence why we substract it) > maximum height of the div that holds the cards
        {
            outerWrapperElement.style.height = `calc(${parseInt(getComputedStyle(outerWrapperElement).maxHeight)}px - 3.5em)`;
        }
    }

    let createNewDivInitialHeight: number;
    onMount(() =>
    {
        createNewDivInitialHeight = createNewCardDiv.clientHeight;
    });

    /**
     * This function executes the callback everytime a card has been fully loaded by checking the size of the elementToObserve. Which in this case will always be the container element that holds all of the cards. So this container element's size will change once a card has been fully loaded, since a fully loaded card with a cover image/amount of attachments is larger than a card that is still loading
     */
    function executeCallbackOnElementSizeChange(elementToObserve: HTMLElement, callback: Function)
    {
        let resizeObserver = new ResizeObserver(entries => {//Gets called when the element(s) we observed with `resizeObserver.observe()` change(s) in size. Since we are observering the element that holds all of the card elements, its size will change (the height will increase) everytime a card is loaded. When we say "a card loaded" we mean its cover image/amount of attachments loaded

            if (createNewCardDiv.classList.contains("newCardCreating") && newCardTitleValue == "")
            {//The second check makes sure we don't scroll down at every keystroke while the user is typing the new cards title.
                callback();
                setTimeout(() => resizeObserver.disconnect(), 10000); //Since we add a new "listener" everytime this function is called (read: everytime we create a card) we do want to "unlisten" at some point. However, we can't unlisten immediately after calling the callback since there could be more cards that haven't loaded in yet that would require us to scroll down again. After 10 seconds however all the cards should have loaded in, therefore we can unlisten
            }
        });

        resizeObserver.observe(elementToObserve);
    }

    /**
     * This does the opposite of openCreateNewCard() and hides the input field + add/close buttons and reveals the "+ Add a card" text again
     */
    function closeCreateNewCard(e?: MouseEvent)
    {
        e?.stopPropagation();
        createNewCardDiv.classList.remove("newCardCreating");
        outerWrapperElement.style.height = "auto";
    }
</script>

<div id="createNewCardDiv" class="newCard" bind:this={createNewCardDiv} onclick={openCreateNewCard} use:clickOutside onclick_outside={closeCreateNewCard} tabindex="0" onkeydown={handleKeyDown}>
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
    <span>
        {I18n.t("addACard")}
    </span>
    <!--     The things above this line are only displayed when the `newCardCreating` styleclass isn't applied. The elements below this line are only displayed when the `newCardCreating` styleclass is applied       -->
    <input bind:this={newCardTitleInput} bind:value={newCardTitleValue} spellcheck="false" onkeydown={e => e.key === "Enter" && createNewCard()} placeholder={I18n.t("enterCardTitle")}>
    <div>
        <button onclick={createNewCard}>
            {I18n.t("addCard")}
        </button>
        <svg onclick={closeCreateNewCard} xmlns="http://www.w3.org/2000/svg" viewBox="2 2 20 20" stroke-width="1.5">
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

    :global(.newCardCreating) { /* If we don't add the :global() then this styleclass gets stripped from the build because "it isn't used" */
        background-color: var(--background-color) !important;
        -webkit-box-shadow: 0 0 1em rgba(var(--main-text-rgb-values), 0.5) !important;
        text-decoration: none !important;
        display: flex !important;
        flex-flow: column !important;
        gap: 1em !important;
        padding: 0.5em !important;
    }

    :global(.newCardCreating:hover) {
        cursor: auto !important;
        background-color: var(--background-color) !important;
    }

    :global(.newCardCreating input, .newCardCreating button) {
        display: unset !important;
    }

    :global(.newCardCreating svg, .newCardCreating span) {
        display: none;
    }

    :global(.newCardCreating input) {
        border: 2px solid var(--accent);
        border-radius: 3px;
        box-shadow: none;
        padding: 0.5em;
    }

    :global(.newCardCreating div) {
        display: flex;
        justify-content: space-between;
        align-items: center;
        align-content: center;
    }

    :global(.newCardCreating div button) {
        height: 2.5em;
        background-color: var(--accent);
        border: none;
        border-radius: 3px;
        font-size: 14px;
        padding: 0.5em;
        color: white;
        transition: 0.2s;
    }

    :global(.newCardCreating div button:hover) {
        height: 2.5em;
        background-color: var(--accent-button-hover);
        cursor: pointer;
    }

    :global(.newCardCreating div svg) {
        stroke: var(--unselected-button);
        display: unset;
        height: 1.75em;
        width: 1.75em !important;
        transition: 0.2s;
        padding: 0 !important;
    }

    :global(.newCardCreating div svg:hover) {
        stroke: var(--selected-button);
        cursor: pointer;
    }
</style>