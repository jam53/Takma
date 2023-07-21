<svelte:head>
    <script type="text/javascript">
        Coloris({
            el: '.coloris',
        });

        /** Instances **/

        Coloris.setInstance('.instance1', {
            theme: 'default',
            themeMode: document.documentElement.style.getPropertyValue("color-scheme"),
            formatToggle: true,
            swatches: [
                '#067bc2',
                '#84bcda',
                '#80e377',
                '#ffdd00',
                '#f5771e',
                '#e73136'
            ]
        });
    </script>
</svelte:head>

<script lang="ts">
    import {slide} from "svelte/transition";
    import {clickOutside} from "../../scripts/ClickOutside";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {selectedBoardId} from "../../scripts/stores";
    import type {Label} from "../../scripts/Board";

    export let mouseClickEvent;
    export let cardToSave;
    export let refreshCardFunction;

    let navElement;
    $: (mouseClickEvent && navElement) && openContextMenu(mouseClickEvent); //Runs the `openContextMenu()` function to show the context menu, once the `mouseClickEvent` and `navElement` variables are set i.e. no longer undefined

    let lastPickedColor: string;  //The last color that was selected using the color picker. Represents a color value which can be used in css, could be a hexidecimal color value including #, "red", rgba(100, 1, 1, 1), etc.
    document.addEventListener('coloris:pick', event => lastPickedColor = event.detail.color);

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

    function openContextMenu(e)
    {
        getContextMenuDimension(navElement);
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

    function closeContextMenu()
    {
        //This makes it so we don't close the LabelsPopup whilst the color picker is open. Clickoutside would fire and cause this function to be executed when we click on the color picker, since the color picker is a seperate object in the DOM and not part of the LabelsPopup
        if (document.querySelector(".clr-open") === null)
        {
            // To make context menu disappear when
            // mouse is clicked outside context menu
            showMenu = false;
        }
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

    /**
     * When we click on a label, this function adds/removes the label from the card depending on whether or not the label was/wasn't assigned to the card before clicking.
     */
    function handleLabelClick(clickedLabelId: string)
    {
        if (cardToSave.labelIds.includes(clickedLabelId))
        {
            cardToSave.labelIds = cardToSave.labelIds.filter(labelId => labelId != clickedLabelId); //Removes the clicked label from the card
        }
        else //The clicked label wasn't assigned to the card yet, so we add it here
        {
            cardToSave.labelIds.push(clickedLabelId);
        }

        cardToSave = cardToSave; //We do this so that when we select/unselect a label by clicking on the colored div bar, rather than the checbkox. That the checkbox would also update to reflect the new state
        refreshCardFunction(); //We do this so that once we add/remove a label. The card which shows the labels, updates, otherwise the newly added/removed labels wouldn't appear until the next time we open this card.
    }

    function createNewLabel()
    {
        const newLabelId = crypto.randomUUID();

        //region add label to board
        const newLabel: Label = {
            id: newLabelId,
            color: lastPickedColor
        };
        SaveLoadManager.getData().addLabelToBoard($selectedBoardId, newLabel);
        //endregion

        cardToSave.labelIds.push(newLabelId); //Add label to this card


        refreshCardFunction(); //Refresh the card's UI, so that the newly added label appears
    }
</script>

{#if showMenu}
    <nav use:getContextMenuDimension style="position: absolute; top:{pos.y}px; left:{pos.x}px; z-index: 1;"
         use:clickOutside
         on:click_outside={closeContextMenu}
         bind:this={navElement}
    >
        <div class="navbar" id="navbar" transition:slide|global>
            <h3 class="title">
                %%Labels
            </h3>
            <br>
            <div class="labelsHolder">
                {#each SaveLoadManager.getData().getBoard($selectedBoardId).labels as label}
                    <div class="labelOption">
                        <input type="checkbox" checked={cardToSave.labelIds.includes(label.id)}
                             on:click={() => handleLabelClick(label.id)}/>
                        <div style="background-color: {label.color}"
                             on:click={() => handleLabelClick(label.id)}></div>
                        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </div>
                {/each}
            </div>
            <br>
            <button class="createNewLabelButton coloris instance1" value="red"
                on:change={createNewLabel}
            >
<!--When clicking on this  button, the color picker will automatically be opened-->
                %%Create a new label
            </button>
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
        background-color: var(--background-color);
        backdrop-filter: blur(10px);
        border-radius: 5px;
        overflow: hidden;
        flex-direction: column;
        border: 1px solid rgba(var(--background-color-rgb-values), 0.4);
        -webkit-box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
        width: 18em;
        padding: 1em 0.5em 0.5em 0.5em;
    }

    .title {
        text-align: center;
    }

    .labelsHolder {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        max-height: 30vh;
        overflow-y: auto;
        padding: 0 1em 0 0.5em;
    }

    .labelOption {
        display: flex;
        align-items: center;
        gap: 1em;
    }

    .labelOption div {
        width: 100%;
        height: 2em;
        border-radius: 5px;
        cursor: pointer;
        transition: 0.1s;
    }

    .labelOption div:hover {
        filter: brightness(70%);
    }

    .labelOption input {
        transform: scale(1.3);
        cursor: pointer;
    }

    .labelOption svg {
        height: 1.4em;
        cursor: pointer;
        transition: 0.3s;
    }

    .labelOption svg:hover {
        color: var(--unselected-buton);
    }

    .createNewLabelButton {
        border: none;
        background-color: var(--border);
        cursor: pointer;
        transition: 0.3s;
        border-radius: 5px;
        height: 2em;
        font-size: medium;
    }

    .createNewLabelButton:hover {
        background-color: var(--unselected-buton);
    }
</style>
