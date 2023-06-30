<script lang="ts">
    import {slide} from "svelte/transition";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import type {Card as CardInterface, List} from "../../scripts/Board";
    import {selectedBoardId} from "../../scripts/stores";
    import {dndzone} from "svelte-dnd-action";
    import {flip} from "svelte/animate";
    import Card from "./Card.svelte";
    import ListOptionsMenu from "./ListOptionsMenu.svelte";
    import {clickOutside} from "../../scripts/ClickOutside";

    export let listId: string;
    export let cards: CardInterface[];
    export let onDrop;
    export let dragDisabled;
    export let setDragDisabled;
    export let inTransitionDelay: number;
    export let refreshListsFunction;

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
    }

    let editingTitle; //We use a span to display the list title when we are not editing it, and an input element when we are. We do this since we can't drag the list by the input element.
    let titleTextAreaElement;

    function autoHeightTextArea()
    {
        titleTextAreaElement = document.getElementById("titleTextAreaElement");
        titleTextAreaElement.style.height = (titleTextAreaElement.scrollHeight) + "px";
    }

    let listOptionsMenuElement;
</script>

<div class="list" in:slide|global={{delay: inTransitionDelay*100}} on:introstart={scrollToCreateNewListDiv} on:mouseenter={() => setDragDisabled(false)} on:contextmenu|stopPropagation>
    <div class="titleHolder">
        {#if !editingTitle}
            <span class="listTitle" on:click on:mousedown={() => editingTitle = true}>
                {SaveLoadManager.getData().getList($selectedBoardId, listId).title}
            </span>
        {:else}
            <textarea class="listTitle" bind:this={titleTextAreaElement} id="titleTextAreaElement"
                on:input={e => SaveLoadManager.getData().setListTitle(e.target.value, $selectedBoardId, listId)}
                on:mouseover={() => titleTextAreaElement.focus()}
                on:mouseleave={() => editingTitle = false}
                use:autoHeightTextArea
                on:keydown={e => (e.key === "Enter") && (editingTitle = false)}
            >{SaveLoadManager.getData().getList($selectedBoardId, listId).title}</textarea>
        {/if}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
             on:click={e => listOptionsMenuElement.openContextMenu(e)}
             use:clickOutside on:click_outside={listOptionsMenuElement.closeContextMenu}>
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
        </svg>
    </div>
    <div class="cardsHolder" use:dndzone={{items: cards, type:"card", dropTargetStyle: {}, dragDisabled: dragDisabled, zoneTabIndex: -1, centreDraggedOnCursor: true}} on:consider={handleDndConsiderCards} on:finalize={handleDndFinalizeCards} on:scroll={() => setDragDisabled(true)}>
        {#each cards as card (card.id)}
            <div class="card" animate:flip="{{duration: 300}}">
                <Card id={card.id}/>
            </div>
        {/each}
    </div>
</div>
<ListOptionsMenu bind:this={listOptionsMenuElement} listId={listId} refreshListsFunction={refreshListsFunction}/>

<style>
    .list {
        background-color: rgba(var(--background-color-rgb-values), 0.3);
        backdrop-filter: blur(10px);
        border-radius: 4px;
        padding: 0 0.25em;
        transition: 0.4s;
        color: var(--main-text);
        width: 16.5em;
        border: 1px solid rgba(var(--background-color-rgb-values), 0.4);
        -webkit-box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
        cursor: pointer;
    }

    .cardsHolder {
        max-height: calc(100vh - 4px - 30px - 2em - (2 * 8px) - (2 * 0.5em) - (2 * 0.75em) - (2 * 1px) - 2.5em); /* 100vh - the borderwidth in the `.bodyNotMaximized` styleclass in `index.html` - height title bar in the `.titlebar` styleclass in `index.html` - navbar height in the `.containingDiv` styleclass in `NavBar.svelte` - (2 * height of the scrollbar at the bottom) - padding bottom en top van .listHolder in BoardScreen - (2 * padding van .titleHolder in dit bestand) - (2 * breedte van de border van de lists) - de hoeveelheid plaats die we vanonder willen, soort van "padding" dus */
        overflow-y: auto;
        padding: 0 0.25em;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
        background-color: rgba(var(--background-color-rgb-values), 0.3);
    }

    /* Handle on hover */
    ::-webkit-scrollbar-thumb:hover {
        background: var(--unselected-buton);
    }

    .listTitle {
        background-color: transparent;
        border: none;
        border-radius: 2px;
        font-size: 1em;
        font-weight: bold;
        padding: 0;
        max-width: 100%;
        width: 100%;
        height: 1.5em;
        resize: none;
        word-wrap: break-word;
        display: inline-block;
    }

    .titleHolder {
        display: flex;
        align-items: center;
        margin: 0.75em 0.25em;
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
</style>