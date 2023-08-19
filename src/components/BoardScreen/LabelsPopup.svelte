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
    import {cardFilters, selectedBoardId} from "../../scripts/stores";
    import type {Label} from "../../scripts/Board";

    export let mouseClickEvent;
    export let cardToSave;
    export let refreshCardFunction;
    export let focusOnCardDetailsFunction;

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
            focusOnCardDetailsFunction(); //If we don't do this after closing the LabelsPopup, the CardDetails element wouldn't be selected (as it lost focus as soon as the LabelsPopup element was displayed). Therefore CardDetails wouldn't register the on:keydown event. Instead the Board would register that. If we would then press Escape or Ctrl+W. The board would close, whereas it should be the CardDetails element that is open that should be the one to actually close
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
        closeContextMenu();
    }

    function editLabelColor(labelId: string)
    {
        SaveLoadManager.getData().editLabelColor($selectedBoardId, labelId, lastPickedColor);

        document.getElementById(`colorDiv${labelId}`).style.backgroundColor = lastPickedColor; //Sets the updated color in the labelsPopup UI
        refreshCardFunction(); //Refresh the card's UI, so that the color change appears in the card
    }

    /**
     * Deletes a label from the board and from all the cards to which the label has been assigned
     * @param labelId
     */
    function deleteLabel(labelId: string)
    {
        SaveLoadManager.getData().removeLabel($selectedBoardId, labelId);
        $cardFilters.labelIds = $cardFilters.labelIds.filter(id => id != labelId);

        document.getElementById(`labelOptionDiv${labelId}`).remove();
        refreshCardFunction(); //Refresh the card's UI, so that the removed label vanishes from the card
    }

    $: navElement?.focus(); //If we don't focus on the navElement, i.e. the container of this popup, then we won't be able to detect the on:keydown event
    function handleKeyDown(e)
    {
        if(e.key === "Escape" || (e.key === "w" && e.ctrlKey))
        {
            closeContextMenu();
        }
    }
</script>

{#if showMenu}
    <nav use:getContextMenuDimension style="position: absolute; top:{pos.y}px; left:{pos.x}px; z-index: 1; box-shadow: none;"
         use:clickOutside
         on:click_outside={closeContextMenu}
         bind:this={navElement}
         on:keydown|stopPropagation={handleKeyDown} tabindex="1"
    >
        <div class="navbar" id="navbar" transition:slide|global>
            <h3 class="title">
                %%Labels
            </h3>
            <br>
            <div class="labelsHolder">
                {#each SaveLoadManager.getData().getBoard($selectedBoardId).labels as label}
                    <div id={`labelOptionDiv${label.id}`} class="labelOption">
                        <input type="checkbox" checked={cardToSave.labelIds.includes(label.id)}
                             on:click={() => handleLabelClick(label.id)}/>
                        <div id={`colorDiv${label.id}`} style="background-color: {label.color}"
                             on:click={() => handleLabelClick(label.id)}></div>
                        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"
                             on:click={() => document.getElementById(label.id).click()}
                        ><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        <input id={label.id} value={label.color} on:change={() => editLabelColor(label.id)} class="coloris instance1" style="width: 0; height: 0; border: none; position: absolute"/>
<!--When we add the `coloris instance1` styleclasses to an `input` or `button`, the color picker will be shown when we click on them. Unfortunately when they contain an svg, the color picker doesn't show up. That's why we have an invisible input here. When we click on the svg, we will programmatically click the input field, thus showing the color picker-->
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                             on:click={() => deleteLabel(label.id)}
                        >
                            <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clip-rule="evenodd" />
                        </svg>
                    </div>
                {/each}
            </div>
            <br>
            <button class="createNewLabelButton coloris instance1"
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
        padding: 0 0.5em;
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

    .labelOption svg {
        width: 2em;
        cursor: pointer;
        transition: 0.3s;
        color: var(--unselected-button);
    }

    .labelOption svg:hover {
        color: var(--main-text);
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
        background-color: var(--unselected-button);
    }

    [type=checkbox] {
        width: 1.5em;
        height: 1.5em;
        color: var(--accent);
        vertical-align: middle;
        -webkit-appearance: none;
        background: none;
        outline: 0;
        flex-grow: 0;
        border-radius: 0.25em;
        transition: background 300ms;
        cursor: pointer;
    }

    [type=checkbox]::before {
        content: "";
        color: transparent;
        display: block;
        width: inherit;
        height: inherit;
        border-radius: inherit;
        border: 0;
        background-color: transparent;
        background-size: contain;
        box-shadow: inset 0 0 0 2px var(--unselected-button);
        transition: 0.3s;
    }

    [type=checkbox]:hover::before {
        box-shadow: inset 0 0 0 2px var(--selected-button);
    }

    [type=checkbox]:checked {
        background-color: currentcolor;
    }

    [type=checkbox]:checked::before {
        box-shadow: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='2 2 20 20'%3E %3Cpath d='M15.88 8.29L10 14.17l-1.88-1.88a.996.996 0 1 0-1.41 1.41l2.59 2.59c.39.39 1.02.39 1.41 0L17.3 9.7a.996.996 0 0 0 0-1.41c-.39-.39-1.03-.39-1.42 0z' fill='%23fff'/%3E %3C/svg%3E");
    }

    [type=checkbox]:disabled {
        background-color: #CCD3D8;
        opacity: 0.84;
        cursor: not-allowed;
    }
</style>
