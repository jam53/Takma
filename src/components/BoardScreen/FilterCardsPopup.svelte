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
    import {cardFilters, selectedBoardId} from "../../scripts/stores";
    import {onMount} from "svelte";
    import {clickOutside} from "../../scripts/ClickOutside";
    import {I18n} from "../../scripts/I18n/I18n";

    // pos is cursor position when right click occur
    let pos = {x: -1000000, y: 0}
    // menu is dimension (height and width) of context menu
    let menu = {h: 0, w: 0}
    // browser/window dimension (height and width)
    let browser = {w: 0, h: 0}
    // showMenu is state of context-menu visibility
    let showMenu = true;
    // to display some text
    let content;

    onMount(() =>
    {
        closeContextMenu(); //A couple things to note here, we start with `showMenu` set to `true` and the xPos of the popup menu set to -1000000. We do this because when we open the popup menu for the first time, the width is very small. When we open it for a second time the width is correct. This is why we start with `showMenu` set to `true`. Now in this case the popup menu wont have the correct with and it will be visible even though the user hasn't opened it. We avoid the user from seeing this by positioning it somewhere off screen by setting the xPos to -1000000. Once the UI is loaded (i.e. when this onMount function gets called) we close the popup menu. This is because if we would leave it open, the popup menu would get shown at the correct location when the user chooses to open it. But the intro transition won't be played since it would already be open, that's why we close it. Now when the user chooses to open the popup menu, the intro transition will be played and the popup menu will have the correct width.
    });

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
     * When we click on a label, this function adds/removes the label from the cardfilters depending on whether or not the label was/wasn't assigned to the cardfilters before clicking.
     */
    function handleLabelClick(clickedLabelId: string)
    {
        if ($cardFilters.labelIds.includes(clickedLabelId))
        {
            $cardFilters.labelIds = $cardFilters.labelIds.filter(labelId => labelId != clickedLabelId); //Removes the clicked label from the cardfilters
        }
        else //The clicked label wasn't assigned to the card yet, so we add it here
        {
            $cardFilters.labelIds.push(clickedLabelId);
        }

        $cardFilters = $cardFilters; //We do this so that when we select/unselect a label by clicking on the colored div bar, rather than the checkbox. That the checkbox would also update to reflect the new state and so that the boarscreen rerenders the list with the filtered cards.
    }

    /**
     * When we click on a due date, this function adds/removes the due date from the cardfilters depending on whether or not the label was/wasn't assigned to the cardfilters before clicking.
     */
    function handleDueDateClick(dueDateValue: number)
    {
        if ($cardFilters.dueDates.includes(dueDateValue))
        {
            $cardFilters.dueDates = $cardFilters.dueDates.filter(dueDate => dueDate != dueDateValue); //Removes the due date from the cardfilters
        }
        else //The clicked label wasn't assigned to the card yet, so we add it here
        {
            $cardFilters.dueDates.push(dueDateValue);
        }

        $cardFilters = $cardFilters; //We do this so that when we select/unselect a due date by clicking on the div, rather than the checkbox. That the checkbox would also update to reflect the new state and so that the boarscreen rerenders the list with the filtered cards.
    }

    let navElement;
    $: navElement?.focus(); //If we don't focus on the navElement, i.e. the container of this popup, then we won't be able to detect the on:keydown event
    function handleKeyDown(e)
    {
        if(e.key === "Escape" || (e.key === "w" && e.ctrlKey))
        {
            closeContextMenu();
        }
    }

    let dueDateValues = [
        {value: 0, title: I18n.t("overdue"), color: "danger"},
        {value: 24 * 60 * 60 * 1000, title: I18n.t("dueNextDay"), color: "warning"},
        {value: 7 * 24 * 60 * 60 * 1000, title: I18n.t("dueNextWeek"), color: "normal"},
        {value: 30 * 24 * 60 * 60 * 1000, title: I18n.t("dueNextMonth"), color: "normal"},
    ];
</script>

{#if showMenu}
    <nav use:getContextMenuDimension style="position: absolute; top:{pos.y}px; left:{pos.x}px; z-index: 1; box-shadow: none"
         use:clickOutside
         on:click_outside={closeContextMenu}
         bind:this={navElement}
         on:keydown|stopPropagation={handleKeyDown} tabindex="1"
    >
        <div class="navbar" id="navbar" transition:slide>
            <h3 class="title">
                {I18n.t("filterCards")}
            </h3>
            <br>
            <h4>{I18n.t("dueDate")}</h4>
            <div class="dueDatesHolder">
                {#each dueDateValues as dueDate}
                    <div class="dueDate"
                         on:click={() => handleDueDateClick(dueDate.value)}
                    >
                        <input type="checkbox" checked={$cardFilters.dueDates.includes(dueDate.value)}>
                        <svg stroke="currentColor" class:danger={dueDate.value === 0} class:warning={dueDate.value === 24 * 60 * 60 * 1000} stroke-width="0" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"></path></svg>
                        <span>
                            {dueDate.title}
                        </span>
                    </div>
                {/each}
            </div>
            {#if SaveLoadManager.getData().getBoard($selectedBoardId)?.labels.length > 0}
                <hr>
                <h4>{I18n.t("labels")}</h4>
                <div class="labelsHolder">
                    {#if $selectedBoardId !== ""}
                    {#each SaveLoadManager.getData().getBoard($selectedBoardId).labels as label}
                        <div id={`labelOptionDiv${label.id}`} class="labelOption"
                             on:click={() => handleLabelClick(label.id)}
                        >
                            <input type="checkbox" checked={$cardFilters.labelIds.includes(label.id)}/>
                            <div id={`colorDiv${label.id}`} style="background-color: {label.color}"></div>
                        </div>
                    {/each}
                    {/if}
                </div>
            {/if}
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
        width: 18em;
        padding: 1em 0.5em 0.5em 0.5em;
    }

    .title {
        text-align: center;
    }

    .labelsHolder, .dueDatesHolder {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        max-height: 30vh;
        overflow-y: auto;
        padding: 0 0.5em;
    }

    .labelOption, .dueDate {
        display: flex;
        align-items: center;
        gap: 1em;
        cursor: pointer;
    }

    .labelOption div {
        width: 100%;
        height: 2em;
        border-radius: 5px;
        transition: 0.1s;
    }

    .labelOption div:hover {
        filter: brightness(70%);
    }

    .labelOption svg {
        width: 2em;
        transition: 0.3s;
        color: var(--unselected-button);
    }

    .labelOption svg:hover {
        color: var(--main-text);
    }

    .dueDate {
        gap: 0.35em;
    }

    .dueDate svg {
        width: 1.5em;
        margin-left: 0.65em;
    }

    .danger {
        fill: var(--danger);
    }

    .warning {
        fill: var(--warning)
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

    hr {
        border: none;
        border-bottom: 1px solid var(--main-text);
        margin: 0.75em 0;
    }

    h4 {
        padding-bottom: 0.25em;
    }
</style>
