<script lang="ts">
    import {slide} from "svelte/transition";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import type {Card as CardInterface, List} from "../../scripts/Board";
    import {cardFilters, searchBarValue, selectedBoardId} from "../../scripts/Stores.svelte.js";
    import {dndzone} from "svelte-dnd-action";
    import {flip} from "svelte/animate";
    import Card from "./Card.svelte";
    import ListOptionsMenu from "./ListOptionsMenu.svelte";
    import CreateNewCard from "./CreateNewCard.svelte";
    import {mount, untrack} from "svelte";
    import {I18n} from "../../scripts/I18n/I18n";
    import {debug, info} from "@tauri-apps/plugin-log";
    import {debounce} from "../../scripts/Debounce";

    interface Props {
        cards: CardInterface[];
        onDrop: Event;
        dragDisabled: boolean;
        setDragDisabled: Function;
        inTransitionDelay: number;
        list: List;
        lists: List[];
        showLabelsText: boolean;
    }

    let {
        cards,
        onDrop,
        dragDisabled,
        setDragDisabled,
        inTransitionDelay,
        list = $bindable(),
        lists = $bindable(),
        showLabelsText = $bindable(),
    }: Props = $props();


    $effect(() =>
    {
        //Svelte dnd automatically adds `tabindex=0` to the card divs which contain the Card component. Since we don't want the containing div to be tabbable, we set the tabindex to -1
        const cardElements = document.querySelectorAll('.card');
        let cards: HTMLElement[] = Array.from(cardElements);

        cards.forEach(card => {
            card.tabIndex = -1;
        });
    });

    /**
     * After we created a new list, this function will be called to scroll to the `createNewList` component, so that it is visible on screen again since it will be pushed to the side by the new list that was just created.
     * If there aren't that many lists, and the `createNewList` component is still visible on the screen. The function will still be called however we won't see anything change visually, since .scrollIntoView() won't do anything because the `createNewList` component is still visible.
     *
     * We call this function when the intro animation of each list starts. If we would call the scrollIntoView() function to early, we wouldn't scroll since the UI wouldn't have refreshed yet to show the new list and the `createNewList` component would still be on screen. It might not be ideal but I figured out that `onintrostart` gets fired once this component is visible on screen. So we we can use `onintrostart` to execute this scrollIntoView() function.
     * However, if we don't check whether or not the `createNewList` component contains the `newListCreating` styleclass. We would also scroll to the `createNewList` when we just open a board. We don't want that, we only want to scroll to the `createNewList` component if we are adding new lists. This is the case when the `newListCreating` styleclass is applied to the `createNewList` component, hence the if that checks whether or not this styleclass is applied.
     */
    function scrollToCreateNewListDiv()
    {
        let createNewListDiv: HTMLElement = document.getElementById("createNewListDiv")!;

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
        info("Dragged card from/to list:" + list.id);
        onDrop(e.detail.items);
    }

    function handleDraggedElement(draggedElement, data, index) {
    }

    let editingTitle: boolean = $state(false); //We use a span to display the list title when we are not editing it, and an input element when we are. We do this since we can't drag the list by the input element.
    let titleTextAreaElement: HTMLElement = $state();

    function autoHeightTextArea()
    {
        titleTextAreaElement = document.getElementById("titleTextAreaElement")!;
        titleTextAreaElement.style.height = (titleTextAreaElement.scrollHeight) + "px";
    }

    let outerWrapperElement: HTMLElement = $state();

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
        const searchValue: string = searchBarValue.value.toLowerCase().trim();

        return !(
            card.title.toLowerCase().includes(searchValue) ||
            card.description.toLowerCase().includes(searchValue) ||
            card.checklists.some(checklist => checklist.title.toLowerCase().includes(searchValue)) ||
            card.checklists.some(checklist => checklist.todos.some(todo => todo.content.toLowerCase().includes(searchValue)))
        );
    }

    let titleHolderElement: HTMLElement;
    $effect(() =>
    {
        list.title; // Ensures the effect reruns to recalculate the list's maxHeight when the user changes its title

        /*
            Calculate the maximum height for the outer wrapper element (i.e. the list).
            This is derived by subtracting various UI element heights and paddings from the total viewport height (100vh).

            100vh        - screen height
            4px          - the border width in the `.bodyNotMaximized` style class in `index.html`
            30px         - height title bar in the `.titlebar` style class in `index.html`
            2em          - navbar height in the `.containingDiv` style class in `NavBar.svelte`
            (2 * 8px)    - (2 * height of the scrollbar at the bottom)
            (2 * 0.5em)  - padding bottom and top of .listHolder in BoardScreen
            (2 * 1px)    - (2 * width of the border of the lists)
            5.25em        - the amount of space we want at the bottom, so some sort of a "padding"
            ${...}       - height of the list title
         */
        titleHolderElement && outerWrapperElement && (outerWrapperElement.style.maxHeight = `calc(100vh - 4px - 30px - 2em - (2 * 8px) - (2 * 0.5em) - (2 * 1px) - 5.25em - ${titleHolderElement.clientHeight}px)`);

        applyOverFlowedStyleClasses();
    });

    // Automatically save the list object when any changes are made except to it's cards property, as changes to those are tracked and saved elsewhere
    let {cards: _, ...listWithoutCards} = $derived(list);
    let debouncedSaveList = debounce((boardId: string, listId: string, list: List) => SaveLoadManager.getData().updateList(boardId, listId, list));
    $effect(() => {
        debug("Saving list: " + listWithoutCards.id);
        debouncedSaveList(selectedBoardId.value, listWithoutCards.id, untrack(() => $state.snapshot(list)));
    });
</script>

<div class="list" in:slide|global={{delay: inTransitionDelay * 100}} onintrostart={scrollToCreateNewListDiv} onmouseenter={() => setDragDisabled(false)} oncontextmenu={e => e.stopPropagation()}>
    <div class="titleHolder" bind:this={titleHolderElement}>
        {#if !editingTitle}
            <span class="listTitle" onclick={() => editingTitle = true} style="height: 100%; min-height: 1em">
                {list.title}
            </span>
        {:else}
            <textarea class="listTitle" bind:this={titleTextAreaElement} id="titleTextAreaElement"
                onfocusout={_ => editingTitle = false}
                bind:value={list.title}
                onmouseover={() => titleTextAreaElement.focus()}
                oninput={autoHeightTextArea}
                use:autoHeightTextArea
                onkeydown={e => (e.key === "Enter") && (editingTitle = false)}
                spellcheck="false"
            >{list.title}</textarea>
        {/if}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" class="listOptionsMenu"
             onclick={e => mount(ListOptionsMenu, {props: {clickEvent: e, list, setList: newList => list = newList, setLists: newLists => lists = newLists}, target: document.body, intro: true})}
        >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
    </div>
    {#key searchBarValue.value}
        {#if searchBarValue.value !== "" || cardFilters.labelIds.length > 0 || cardFilters.dueDate !== Number.MAX_SAFE_INTEGER || cardFilters.complete || cardFilters.incomplete}
            <span class="amountOfCardsMatchedFilter">
                {cards.filter(card => !shouldCardBeHidden(card)).length + " " + (cards.filter(card => !shouldCardBeHidden(card)).length === 1 ? I18n.t("cardMatchedFilters") : I18n.t("cardsMatchedFilters"))}
            </span>
        {/if}
    {/key}
    <div class="outerWrapper" bind:this={outerWrapperElement} onscroll={applyOverFlowedStyleClasses}>
<!--This outerWrapper has `overflow:auto` allowing us to scroll. Whilst this cardsHolder has `overflow:visible` which makes it so the box-shadow doesn't appear cut off when hovering over a card-->
        <div class="cardsHolder" use:dndzone={{items: cards, type:"card", dropTargetStyle: {}, dragDisabled: dragDisabled, zoneTabIndex: -1, transformDraggedElement: handleDraggedElement}} onconsider={handleDndConsiderCards} onfinalize={handleDndFinalizeCards} onscroll={() => setDragDisabled(true)}>
            {#each cards as card (card.id)}
                <div class="card" animate:flip="{{duration: 500}}">
                    {#if !shouldCardBeHidden(card)}
                        <Card {card} bind:list bind:showLabelsText/>
                    {/if}
                </div>
            {/each}
            {#if cards.length === 0}
                <div class="emptyCard" onmouseenter={() => setDragDisabled(true)}>
                    {I18n.t("dropCardHere")}
                </div>
            {/if}
        </div>
    </div>
    <div onmouseenter={() => setDragDisabled(true)} onmouseleave={() => setDragDisabled(false)}>
        <CreateNewCard bind:list {outerWrapperElement}/>
    </div>
</div>

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
        box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
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
    :global(.outerWrapper.overflowed) {
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
        box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
        cursor: auto;
    }

    ::-webkit-scrollbar-track {
        margin: 0.5em 0;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
        background-color: rgba(var(--background-color-rgb-values), 0.3);
        cursor: default;
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
        box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
    }

    .amountOfCardsMatchedFilter {
        margin: 0 1em 0 0.75em;
        font-weight: 200;
        color: rgba(var(--main-text-rgb-values), 0.75);
        display: block;
    }
</style>