<script lang="ts">
    import {slide} from "svelte/transition";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import type {Card as CardInterface} from "../../scripts/Board";
    import {cardFilters, draggingCard, searchBarValue, selectedBoardId} from "../../scripts/stores";
    import {dndzone} from "svelte-dnd-action";
    import {flip} from "svelte/animate";
    import Card from "./Card.svelte";
    import ListOptionsMenu from "./ListOptionsMenu.svelte";
    import {clickOutside} from "../../scripts/ClickOutside";
    import CreateNewCard from "./CreateNewCard.svelte";
    import {afterUpdate} from "svelte";
    import {I18n} from "../../scripts/I18n/I18n";

    export let listId: string;
    export let cards: CardInterface[];
    export let onDrop;
    export let dragDisabled;
    export let setDragDisabled;
    export let inTransitionDelay: number;
    export let refreshListsFunction;

    afterUpdate(() =>
    {
        //Svelte dnd automatically adds `tabindex=0` to the card divs which contain the Card component. Since we don't want the containing div to be tabbable, we set the tabindex to -1
        const cardElements = document.querySelectorAll('.card');
        let cards = Array.from(cardElements);

        cards.forEach(card => {
            card.tabIndex = -1;
        });
    });

    /**
     * After we created a new list, this function will be called to scroll to the `createNewList` component, so that it is visible on screen again since it will be pushed to the side by the new list that was just created.
     * If there aren't that many lists, and the `createNewList` component is still visible on the screen. The function will still be called however we won't see anything change visually, since .scrollIntoView() won't do anything because the `createNewList` component is still visible.
     *
     * We call this function when the intro animation of each list starts. If we would call the scrollIntoView() function to early, we wouldn't scroll since the UI wouldn't have refreshed yet to show the new list and the `createNewList` component would still be on screen. It might not be ideal but I figured out that `on:introstart` gets fired once this component is visible on screen. So we we can use `on:introstart` to execute this scrollIntoView() function.
     * However, if we don't check whether or not the `createNewList` component contains the `newListCreating` styleclass. We would also scroll to the `createNewList` when we just open a board. We don't want that, we only want to scroll to the `createNewList` component if we are adding new lists. This is the case when the `newListCreating` styleclass is applied to the `createNewList` component, hence the if that checks whether or not this styleclass is applied.
     */
    function scrollToCreateNewListDiv()
    {
        let createNewListDiv = document.getElementById("createNewListDiv");

        if (createNewListDiv.classList.contains("newListCreating"))
        {
            createNewListDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    function handleDndConsiderCards(e)
    {
        cards = e.detail.items;
    }

    function handleDndFinalizeCards(e)
    {
        onDrop(e.detail.items);
        $draggingCard = false;
    }

    function handleDraggedElement(draggedElement, data, index) {
        $draggingCard = true;
    }

    let editingTitle; //We use a span to display the list title when we are not editing it, and an input element when we are. We do this since we can't drag the list by the input element.
    let titleTextAreaElement;

    function autoHeightTextArea()
    {
        titleTextAreaElement = document.getElementById("titleTextAreaElement");
        titleTextAreaElement.style.height = (titleTextAreaElement.scrollHeight) + "px";
    }

    let listOptionsMenuElement;
    let outerWrapperElement;
    let cardsHolderElement;

    function applyOverFlowedStyleClasses()
    {
        if (outerWrapperElement.scrollHeight >= outerWrapperElement.clientHeight)
        {
            outerWrapperElement.classList.add('overflowed');
        }
        else if (outerWrapperElement.scrollHeight < outerWrapperElement.clientHeight)
        {
            outerWrapperElement.classList.remove('overflowed');
        }
    }

    function shouldCardBeHidden(card: CardInterface)
    {
        return !(card.title.toLowerCase().includes($searchBarValue.toLowerCase().trim()) || card.description.toLowerCase().includes($searchBarValue.toLowerCase().trim()));
    }

    let titleHolderElement;
    afterUpdate(() =>
    {
        titleHolderElement && outerWrapperElement && (outerWrapperElement.style.maxHeight = `calc(100vh - 4px - 30px - 2em - (2 * 8px) - (2 * 0.5em) - (2 * 1px) - 2.5em - ${titleHolderElement.clientHeight}px)`);
    /*
        100vh        - hoogte scherm
        4px          - the borderwidth in the `.bodyNotMaximized` styleclass in `index.html`
        30px         - height title bar in the `.titlebar` styleclass in `index.html`
        2em          - navbar height in the `.containingDiv` styleclass in `NavBar.svelte`
        (2 * 8px)    - (2 * height of the scrollbar at the bottom)
        (2 * 0.5em)  - padding bottom en top van .listHolder in BoardScreen
        (2 * 1px)    - (2 * breedte van de border van de lists)
        2.5em        - de hoeveelheid plaats die we vanonder willen, soort van "padding" dus
        ${...}       - hoogte van de titel van de lijst
     */

        applyOverFlowedStyleClasses();
    });
</script>

<!--After the first few lists we don't want to show the intro animation so we put its duration to 0. Otherwise if we add a 20th list for example, we would have to wait for 20*100 = 2 seconds until it becomes visible. Usually no more than 7 lists will fit on the screen side by side, hence why we limit the time to 700 milliseconds-->
<div class="list" in:slide|global={{delay: inTransitionDelay*100 <= 700 ? inTransitionDelay*100 : 0}} on:introstart={scrollToCreateNewListDiv} on:mouseenter={() => setDragDisabled(false)} on:contextmenu|stopPropagation>
    <div class="titleHolder" bind:this={titleHolderElement}>
        {#if !editingTitle}
            <span class="listTitle" on:click on:mousedown={() => editingTitle = true} style="height: 100%; min-height: 1em">
                {SaveLoadManager.getData().getList($selectedBoardId, listId).title}
            </span>
        {:else}
            <textarea class="listTitle" bind:this={titleTextAreaElement} id="titleTextAreaElement"
                on:focusout={e => SaveLoadManager.getData().setListTitle(e.target.value.trim(), $selectedBoardId, listId)}
                on:mouseover={() => titleTextAreaElement.focus()}
                on:focusout={() => editingTitle = false}
                on:input={autoHeightTextArea}
                use:autoHeightTextArea
                on:keydown={e => (e.key === "Enter") && (editingTitle = false)}
            >{SaveLoadManager.getData().getList($selectedBoardId, listId).title}</textarea>
        {/if}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" class="listOptionsMenu"
             on:click={e => listOptionsMenuElement.openContextMenu(e)}
             use:clickOutside on:click_outside={listOptionsMenuElement.closeContextMenu}>
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
    </div>
    {#key $searchBarValue}
        {#if $searchBarValue !== "" || $cardFilters.labelIds.length > 0 || $cardFilters.dueDates.length > 0}
            <span class="amountOfCardsMatchedFilter">
                {cards.filter(card => !shouldCardBeHidden(card)).length + " " + (cards.filter(card => !shouldCardBeHidden(card)).length === 1 ? I18n.t("cardMatchedFilters") : I18n.t("cardsMatchedFilters"))}
            </span>
        {/if}
    {/key}
    <div class="outerWrapper" bind:this={outerWrapperElement} on:scroll={applyOverFlowedStyleClasses}>
<!--This outerWrapper has `overflow:auto` allowing us to scroll. Whilst this cardsHolder has `overflow:visible` which makes it so the -webkit-box-shadow doesn't appear cut off when hovering over a card-->
        <div class="cardsHolder" bind:this={cardsHolderElement} use:dndzone={{items: cards, type:"card", dropTargetStyle: {}, dragDisabled: dragDisabled, zoneTabIndex: -1, transformDraggedElement: handleDraggedElement}} on:consider={handleDndConsiderCards} on:finalize={handleDndFinalizeCards} on:scroll={() => setDragDisabled(true)}>
            {#each cards as card (card.id)}
                <div class="card" animate:flip="{{duration: 500}}">
                    {#key $searchBarValue}
                        {#if !shouldCardBeHidden(card)}
                            <Card card={card} refreshListFunction={() => cards = cards} refreshListsFunction={refreshListsFunction} listIdCardIsIn={listId}/>
                        {/if}
                    {/key}
                </div>
            {/each}
            {#if cards.length === 0}
                <div class="emptyCard" on:mouseenter={() => setDragDisabled(true)}>
                    {I18n.t("dropCardHere")}
                </div>
            {/if}
        </div>
    </div>
    <div on:mouseenter={() => setDragDisabled(true)} on:mouseleave={() => setDragDisabled(false)}>
        <CreateNewCard refreshListsFunction={() => refreshListsFunction()} listId={listId} outerWrapperElement={outerWrapperElement}/>
    </div>
</div>
<ListOptionsMenu bind:this={listOptionsMenuElement} listId={listId} refreshListsFunction={refreshListsFunction}/>

<style>
    .list {
        background-color: rgba(var(--background-color-rgb-values), 0.3);
        backdrop-filter: blur(10px);
        border-radius: 4px;
        padding: 0;
        transition: 0.4s;
        color: var(--main-text);
        width: 17.25em;
        border: 1px solid rgba(var(--background-color-rgb-values), 0.4);
        -webkit-box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
        cursor: pointer;
    }

    .cardsHolder {
        padding: 0.5em 0.5em 0.5em 0.5em;
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        overflow: visible;
    }

    .card:empty {
        display: none;
    }

    .outerWrapper {
        /* max-height: gets set through js*/
        overflow-y: auto;
    }

    /*Gets applied when there are too many cards so a scrollbar gets displayed. In that case we add a right margin so that the scrollbar isn't glued to side of the container but that there is some space in between.*/
    :is(.outerWrapper.overflowed) {
        margin-right: 0.25em;
    }

    .emptyCard {
        height: 3em;
        border: 2px dashed rgba(var(--main-text-rgb-values), 0.5);
        border-radius: 4px;
        display: flex;
        justify-content: center;
        flex-direction: column;
        text-align: center;
        -webkit-box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
        cursor: auto;
    }

    ::-webkit-scrollbar-track {
        margin: 0.5em 0;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
        background-color: rgba(var(--main-text-rgb-values), 0.1);
    }

    /* Handle on hover */
    ::-webkit-scrollbar-thumb:hover {
        background: var(--unselected-button);
    }

    .listTitle {
        background-color: transparent;
        border: none;
        border-radius: 2px;
        font-size: 1em;
        font-weight: bold;
        padding: 0 0.5em 0 0.5em;
        max-width: 100%;
        width: 100%;
        height: 1.5em;
        resize: none;
        word-break: break-word;
        display: inline-block;
    }

    .titleHolder {
        display: flex;
        align-items: center;
        margin: 0.75em 0.5em 0.25em 0.25em;
    }

    .titleHolder svg {
        width: 1.5em;
        stroke: var(--main-text);
        transition: 0.3s;
        border-radius: 4px;
    }

    .titleHolder svg:hover {
        background-color: rgba(var(--main-text-rgb-values), 0.3);
        -webkit-box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
    }

    .amountOfCardsMatchedFilter {
        margin: 0 1em 0 0.75em;
        font-weight: 200;
        color: rgba(var(--main-text-rgb-values), 0.75);
        display: block;
    }
</style>