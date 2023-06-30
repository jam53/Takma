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
    import {selectedBoardId} from "../../scripts/stores";
    import {ask} from "@tauri-apps/api/dialog";

    export let listId;
    export let refreshListsFunction;

    // pos is cursor position when right click occur
    let pos = {x: 0, y: 0}
    // menu is dimension (height and width) of context menu
    let menu = {h: 0, w: 0}
    // browser/window dimension (height and width)
    let browser = {w: 0, h: 0}
    // showMenu is state of context-menu visibility
    let showMenu = false;
    // to display some text
    let content;

    export function openContextMenu(e)
    {
        showMenu = true
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
        menuItems = menuItemsDefault;
    }

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

    function duplicateList()
    {
        let thisList = structuredClone(SaveLoadManager.getData().getList($selectedBoardId, listId));
        let thisListIndex = SaveLoadManager.getData().getBoard($selectedBoardId).lists.findIndex(list => list.id === listId);

        SaveLoadManager.getData().createNewList($selectedBoardId, thisList.title, thisList.cards.map(card =>
        {
            card.id = crypto.randomUUID();
            return card;
        }), thisListIndex);

        refreshListsFunction();
    }

    function sortList()
    {
        menuItems = menuItemsSort;
        showMenu = true;
    }

    async function deleteList()
    {
        const response: boolean = await ask("%%Are you sure you want to delete this list?");

        if (response === true)
        {
            SaveLoadManager.getData().deleteList($selectedBoardId, listId);
            refreshListsFunction();
        }
    }

    function sortByCreationDateAscending()
    {
        let thisList = SaveLoadManager.getData().getList($selectedBoardId, listId);
        thisList.cards.sort((a, b) => a.creationDate - b.creationDate);

        SaveLoadManager.getData().updateList($selectedBoardId, listId, thisList);

        refreshListsFunction();
    }

    function sortByCreationDateDescending()
    {
        let thisList = SaveLoadManager.getData().getList($selectedBoardId, listId);
        thisList.cards.sort((a, b) => b.creationDate - a.creationDate);

        SaveLoadManager.getData().updateList($selectedBoardId, listId, thisList);

        refreshListsFunction();
    }

    function sortAlphabeticallyAscending()
    {
        let thisList = SaveLoadManager.getData().getList($selectedBoardId, listId);
        thisList.cards.sort((a, b) => a.title.localeCompare(b.title));

        SaveLoadManager.getData().updateList($selectedBoardId, listId, thisList);

        refreshListsFunction();
    }

    function sortAlphabeticallyDescending()
    {
        let thisList = SaveLoadManager.getData().getList($selectedBoardId, listId);
        thisList.cards.sort((a, b) => b.title.localeCompare(a.title));

        SaveLoadManager.getData().updateList($selectedBoardId, listId, thisList);

        refreshListsFunction();
    }

    function sortShuffle()
    {
        /**
         * Unbiased shuffle algorithm, Fisher-Yates (aka Knuth) Shuffle.
         * @param array
         */
        function shuffle(array) //https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
        {
            let currentIndex = array.length,  randomIndex;

            // While there remain elements to shuffle.
            while (currentIndex != 0)
            {

                // Pick a remaining element.
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;

                // And swap it with the current element.
                [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
            }

            return array;
        }

        let thisList = SaveLoadManager.getData().getList($selectedBoardId, listId);
        shuffle(thisList.cards);

        SaveLoadManager.getData().updateList($selectedBoardId, listId, thisList);

        refreshListsFunction();
    }

    let menuItemsDefault = [
        {
            'name': 'duplicateList',
            'onClick': duplicateList,
            'displayText': "%%Duplicate List",
            'svg': '<svg class="listOptionsMenuIcons" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"> <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6" /></svg>'
        },
        {
            'name': 'sortList',
            'onClick': sortList,
            'displayText': "%%Sort List",
            'svg': '<svg class="listOptionsMenuIcons" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" /></svg>'
        },
        {
            'name': 'hr',
        },
        {
            'name': 'deleteList',
            'onClick': deleteList,
            'displayText': "%%Delete list",
            'svg': '<svg class="listOptionsMenuIcons" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clip-rule="evenodd"/></svg>'
        },
    ];
    let menuItems = menuItemsDefault;

    let menuItemsSort = [
        {
            'name': 'sortByCreationDate(Ascending)',
            'onClick': sortByCreationDateAscending,
            'displayText': "%%Sort By Creation Date (Ascending)",
            'svg': '<svg class="listOptionsMenuIcons" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25"/></svg>'
        },
        {
            'name': 'sortByCreationDate(Descending)',
            'onClick': sortByCreationDateDescending,
            'displayText': "%%Sort By Creation Date (Descending)",
            'svg': '<svg class="listOptionsMenuIcons" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12"/></svg>'
        },
        {
            'name': 'hr'
        },
        {
            'name': 'sortAlphabetically(Ascending)',
            'onClick': sortAlphabeticallyAscending,
            'displayText': "%%Sort Alphabetically (Ascending)",
            'svg': '<svg class="listOptionsMenuIcons" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25"/></svg>'
        },
        {
            'name': 'sortAlphabetically(Descending)',
            'onClick': sortAlphabeticallyDescending,
            'displayText': "%%Sort Alphabetically (Descending)",
            'svg': '<svg class="listOptionsMenuIcons" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12"/></svg>'
        },
        {
            'name': 'hr'
        },
        {
            'name': 'sortShuffle',
            'onClick': sortShuffle,
            'displayText': "%%Shuffle",
            'svg': '<svg class="listOptionsMenuIcons" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><path d="M237.66,178.34a8,8,0,0,1,0,11.32l-24,24A8,8,0,0,1,200,208V192a72.15,72.15,0,0,1-57.65-30.14l-41.72-58.4A56.1,56.1,0,0,0,55.06,80H32a8,8,0,0,1,0-16H55.06a72.12,72.12,0,0,1,58.59,30.15l41.72,58.4A56.08,56.08,0,0,0,200,176V160a8,8,0,0,1,13.66-5.66ZM143,107a8,8,0,0,0,11.16-1.86l1.2-1.67A56.08,56.08,0,0,1,200,80V96a8,8,0,0,0,13.66,5.66l24-24a8,8,0,0,0,0-11.32l-24-24A8,8,0,0,0,200,48V64a72.15,72.15,0,0,0-57.65,30.14l-1.2,1.67A8,8,0,0,0,143,107Zm-30,42a8,8,0,0,0-11.16,1.86l-1.2,1.67A56.1,56.1,0,0,1,55.06,176H32a8,8,0,0,0,0,16H55.06a72.12,72.12,0,0,0,58.59-30.15l1.2-1.67A8,8,0,0,0,113,149Z"></path></svg>'
        },
    ];

</script>

{#if showMenu}
    <nav use:getContextMenuDimension style="position: absolute; top:{pos.y}px; left:{pos.x}px; z-index: 1;">
        <div class="navbar" id="navbar" transition:slide>
            <ul>
                {#each menuItems as item}
                    {#if item.name === "hr"}
                        <hr>
                    {:else}
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
