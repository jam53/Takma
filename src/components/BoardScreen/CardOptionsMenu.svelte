<!--
Github @dukenmarga, July 2022
Context Menu is small menu that displayed when user right-click the mouse on browser.
Think of it as a way to show Refresh option on Microsoft Windows when right-click on desktop.
Known bug:
    - If the browser loads the content for the first time, showMenu set to false.
    Hence, we cannot get menu.h and menu.y dimension, since context menu has not been available at DOM.
    The first right click will not shown properly when right-click occurs around the edge (bottom part
    and right part) of the browser.

Inspired from: Context Menu https://svelte.dev/repl/3a33725c3adb4f57b46b597f9dade0c1?version=3.25.0
-->

<script lang="ts">
    import {slide} from "svelte/transition";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {copiedCard, selectedBoardId} from "../../scripts/stores";
    import {I18n} from "../../scripts/I18n/I18n";
    import {clickOutside} from "../../scripts/ClickOutside";
    import {
        duplicateCard as duplicateCardObject,
        duplicateCardAsCopiedCard, duplicateCopiedCardAsCard
    } from "../../scripts/Board";

    export let cardId;
    export let refreshListsFunction;
    export let listIdCardIsIn;

    let navElement;

    // pos is cursor position when right click occur
    let pos = {x: 0, y: 0}
    // menu is dimension (height and width) of context menu
    let menu = {h: 0, w: 0}
    // browser/window dimension (height and width)
    let browser = {w: 0, h: 0}
    // showMenu is state of context-menu visibility
    let showMenu = true;
    // to display some text
    let content;

    export function openContextMenu(e)
    {
        showMenu = true;
        browser = {
            w: window.innerWidth,
            h: window.innerHeight
        };
        pos = {
            x: e.clientX,
            y: e.clientY
        };
        // If bottom part of context menu will be displayed
        // after right-click, then change the position of the
        // context menu. This position is controlled by `top` and `left`
        // at inline style.
        // Instead of context menu is displayed from top left of cursor position
        // when right-click occur, it will be displayed from bottom left.
        if (browser.h - pos.y < menu.h)
            pos.y = pos.y - menu.h
        if (browser.w - pos.x < menu.w)
            pos.x = pos.x - menu.w
    }

    export function closeContextMenu()
    {
        // To make context menu disappear when
        // mouse is clicked outside context menu
        showMenu = false;
    }

    /**
     * @param node This node will always be the hidden navElement, since this function gets called using `use:getContextMenuDimension` which basically means this function gets called as soon as the hidden navElement with `use:` has been loaded into the DOM.
     */
    function getContextMenuDimension(node)
    {
        // This function will get context menu dimension
        // when navigation is shown => showMenu = true
        let height = node.offsetHeight
        let width = node.offsetWidth
        menu = {
            h: height,
            w: width
        }
    }

    async function duplicateCard()
    {
        let thisCardIndex = SaveLoadManager.getData().getList($selectedBoardId, listIdCardIsIn).cards.findIndex(card => card.id === cardId);
        let duplicatedCard = await duplicateCardObject(SaveLoadManager.getData().getCard($selectedBoardId, cardId), $selectedBoardId);

        SaveLoadManager.getData().addCardToList(duplicatedCard, $selectedBoardId, listIdCardIsIn, thisCardIndex);

        refreshListsFunction();
        closeContextMenu();
    }

    async function deleteCard()
    {
        SaveLoadManager.getData().deleteCard($selectedBoardId, cardId);
        refreshListsFunction();
        closeContextMenu();
    }

    async function copyCard()
    {
        $copiedCard = await duplicateCardAsCopiedCard(SaveLoadManager.getData().getCard($selectedBoardId, cardId)!, $selectedBoardId);
        closeContextMenu();
    }

    async function pasteCard()
    {
        let thisCardIndex = SaveLoadManager.getData().getList($selectedBoardId, listIdCardIsIn).cards.findIndex(card => card.id === cardId);

        let cardToPaste = await duplicateCopiedCardAsCard($copiedCard!, $selectedBoardId); //Since this function was called, it means the `$copiedCard` variable can't be null. Hadn't there been a card copied i.e. should `$copiedCard` have been null, then the button on which this function gets called wouldn't have been visible

        SaveLoadManager.getData().addCardToList(cardToPaste, $selectedBoardId, listIdCardIsIn, thisCardIndex);

        refreshListsFunction();
        closeContextMenu();
    }

    let menuItems = [
        {
            'name': 'duplicateCard',
            'onClick': duplicateCard,
            'displayText': I18n.t("duplicateCard"),
            'svg': '<svg class="listOptionsMenuIcons" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"> <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6" /></svg>'
        },
        {
            'name': 'hr',
        },
        {
            'name': 'copyCard',
            'onClick': copyCard,
            'displayText': I18n.t("copyCard"),
            'svg': '<svg class="listOptionsMenuIcons" stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path><path d="M16 4h2a2 2 0 0 1 2 2v4"></path><path d="M21 14H11"></path><path d="m15 10-4 4 4 4"></path></svg>'
        },
        {
            'name': 'pasteCard',
            'onClick': pasteCard,
            'displayText': I18n.t("pasteCard"),
            'svg': '<svg class="listOptionsMenuIcons" stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M15 2H9a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1Z"></path><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2M16 4h2a2 2 0 0 1 2 2v2M11 14h10"></path><path d="m17 10 4 4-4 4"></path></svg>'
        },
        {
            'name': 'hr',
        },
        {
            'name': 'deleteCard',
            'onClick': deleteCard,
            'displayText': I18n.t("deleteCard"),
            'svg': '<svg class="listOptionsMenuIcons" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clip-rule="evenodd"/></svg>'
        },
    ];

    $: navElement?.focus(); //If we don't focus on the navElement, i.e. the container of this popup, then we won't be able to detect the on:keydown event
    function handleKeyDown(e)
    {
        if(e.key === "Escape" || (e.key.toLowerCase() === "w" && e.ctrlKey))
        {
            closeContextMenu();
        }
    }
</script>

<!--This hidden navElement looks exactly the same as `navElement` but is hidden and has no animations. This way it can be used to gt the correct dimensions of the `navElement`, without having to wait for it's intro animation to finish-->
<nav style="visibility: hidden; position: absolute;"
     use:getContextMenuDimension
>
    <div class="navbar" >
        <ul>
            {#each menuItems as item}
                {#if item.name === "hr"}
                    <hr>
                {:else if item.name !== "pasteCard" || (item.name === "pasteCard" && $copiedCard !== null)}
                    <li>
                        <button on:click={item.onClick}>
                            {@html item.svg}
                            {item.displayText}
                        </button>
                    </li>
                {/if}
            {/each}
        </ul>
    </div>
</nav>
{#if showMenu}
    <nav style="position: absolute; top:{pos.y}px; left:{pos.x}px; z-index: 1; box-shadow: none"
         use:clickOutside
         on:click_outside={closeContextMenu}
         bind:this={navElement}
         on:keydown|stopPropagation={handleKeyDown} tabindex="1"
    >
        <div class="navbar" id="navbar" transition:slide|global>
            <ul>
                {#each menuItems as item}
                    {#if item.name === "hr"}
                        <hr>
                    {:else if item.name !== "pasteCard" || (item.name === "pasteCard" && $copiedCard !== null)}
                        <li>
                            <button on:click={item.onClick}>
                                {@html item.svg}
                                {item.displayText}
                            </button>
                        </li>
                    {/if}
                {/each}
            </ul>
        </div>
    </nav>
{/if}

<style>
    * {
        padding: 0;
        margin: 0;
    }

    .navbar {
        display: inline-flex;
        background-color: rgba(var(--background-color-rgb-values), 0.5);
        backdrop-filter: blur(10px);
        border-radius: 5px;
        overflow: hidden;
        flex-direction: column;
        border: 1px solid rgba(var(--background-color-rgb-values), 0.4);
        -webkit-box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
    }

    .navbar ul {
        margin: 6px;
    }

    ul li {
        display: block;
        list-style-type: none;
        width: 1fr;
    }

    ul li button {
        font-size: 1rem;
        color: var(--main-text);
        width: 100%;
        text-align: left;
        border: 0;
        background-color: transparent;
        cursor: pointer;
        display: flex;
        gap: 0.5em;
        align-items: center;
        padding: 0.5em;
        transition: 0.3s;
    }

    ul li button:hover {
        text-align: left;
        border-radius: 5px;
        background-color: rgba(var(--background-color-rgb-values), 0.8);
        -webkit-box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
    }

    hr {
        border: none;
        border-bottom: 1px solid var(--main-text);
        margin: 5px 0;
    }

    :global(.listOptionsMenuIcons) {
        height: 1.3em;
    }
</style>
