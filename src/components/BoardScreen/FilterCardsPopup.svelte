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
    import {cardFilters, selectedBoardId} from "../../scripts/Stores.svelte.js";
    import {clickOutside} from "../../scripts/ClickOutside";
    import {I18n} from "../../scripts/I18n/I18n";
    import {info} from "@tauri-apps/plugin-log";

    interface Props {
        clickEvent: MouseEvent,
    }

    let { clickEvent }: Props = $props();

    // pos is cursor position when right click occur
    let pos = $state({x: 0, y: 0});
    // menu is dimension (height and width) of context menu
    let menu = {h: 0, w: 0};
    // browser/window dimension (height and width)
    let browser = {w: 0, h: 0};
    // showMenu is state of context-menu visibility
    let showMenu = $state(true);

    export function openContextMenu(e: MouseEvent)
    {
        info("Opening filter cards popup for board:" + selectedBoardId.value);
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
            pos.y = pos.y - menu.h;
        if (browser.w - pos.x < menu.w)
            pos.x = pos.x - menu.w;
    }

    function closeContextMenu()
    {
        // To make context menu disappear when
        // mouse is clicked outside context menu
        showMenu = false;
    }

    /**
     * @param node This node will always be the hidden navElement, since this function gets called using `use:getContextMenuDimension` which basically means this function gets called as soon as the hidden navElement with `use:` has been loaded into the DOM.
     */
    function getContextMenuDimension(node: HTMLElement)
    {
        // This function will get context menu dimension
        // when navigation is shown => showMenu = true
        let height = node.offsetHeight;
        let width = node.offsetWidth;
        menu = {
            h: height,
            w: width
        };
        openContextMenu(clickEvent);
    }

    /**
     * When we click on a label, this function adds/removes the label from the cardfilters depending on whether or not the label was/wasn't assigned to the cardfilters before clicking.
     */
    function handleLabelClick(clickedLabelId: string)
    {
        if (cardFilters.labelIds.includes(clickedLabelId))
        {
            cardFilters.labelIds = cardFilters.labelIds.filter(labelId => labelId != clickedLabelId); //Removes the clicked label from the cardfilters
        }
        else //The clicked label wasn't assigned to the card yet, so we add it here
        {
            cardFilters.labelIds.push(clickedLabelId);
        }

        cardFilters.labelIds = cardFilters.labelIds; //We do this so that when we select/unselect a label by clicking on the colored div bar, rather than the checkbox. That the checkbox would also update to reflect the new state and so that the boarscreen rerenders the list with the filtered cards.
    }

    let navElement: HTMLElement | null = $state(null);
    $effect(() => {
        navElement?.focus();
    }); //If we don't focus on the navElement, i.e. the container of this popup, then we won't be able to detect the on:keydown event

    function handleKeyDown(e: KeyboardEvent)
    {
        e.stopPropagation();
        if(e.key === "Escape" || (e.key.toLowerCase() === "w" && e.ctrlKey))
        {
            closeContextMenu();
        }
    }

    let dueDateValues = [
        {value: 0, title: I18n.t("overdue"), color: "danger"},
        {value: 24 * 60 * 60 * 1000, title: I18n.t("dueNextDay"), color: "warning"},
        {value: 7 * 24 * 60 * 60 * 1000, title: I18n.t("dueNextWeek"), color: "normal"},
        {value: 30 * 24 * 60 * 60 * 1000, title: I18n.t("dueNextMonth"), color: "normal"},
        {value: 365 * 24 * 60 * 60 * 1000, title: I18n.t("dueNextYear"), color: "normal"},
        {value: 10 * 365 * 24 * 60 * 60 * 1000, title: I18n.t("dueNextDecade"), color: "normal"},
        {value: 100 * 365 * 24 * 60 * 60 * 1000, title: I18n.t("dueNextCentury"), color: "normal"},
    ];
</script>

{#if showMenu}
    <nav style="position: absolute; top:{pos.y}px; left:{pos.x}px; z-index: 1; box-shadow: none"
         use:clickOutside
         onclick_outside={closeContextMenu}
         bind:this={navElement}
         onkeydown={handleKeyDown} tabindex="1"
         use:getContextMenuDimension
    >
        <div class="navbar" id="navbar" transition:slide|global>
            <h3 class="title">
                {I18n.t("filterCards")}
            </h3>
            <br>
            <h4>{I18n.t("dueDate")}</h4>
            <div class="dueDatesHolder">
                {#each dueDateValues as dueDate}
                    <div class="dueDate"
                         onclick={() => cardFilters.dueDate = cardFilters.dueDate === dueDate.value ? Number.MAX_SAFE_INTEGER : dueDate.value}
                    >
                        <input type="checkbox" checked={cardFilters.dueDate === dueDate.value}>
                        <svg stroke="currentColor" class:danger={dueDate.value === 0} class:warning={dueDate.value === 24 * 60 * 60 * 1000} stroke-width="0" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"></path></svg>
                        <span>
                            {dueDate.title}
                        </span>
                    </div>
                {/each}
            </div>
            {#if SaveLoadManager.getData().getBoard(selectedBoardId.value)?.labels.length > 0}
                <hr>
                <h4>{I18n.t("labels")}</h4>
                <div class="labelsHolder">
                    {#if selectedBoardId.value !== ""}
                    {#each SaveLoadManager.getData().getBoard(selectedBoardId.value).labels as label}
                        <div class="labelOption"
                             onclick={() => handleLabelClick(label.id)}
                        >
                            <input type="checkbox" checked={cardFilters.labelIds.includes(label.id)}/>
                            <div id={`colorDiv${label.id}`} style="background-color: {label.color}">
                                <span style="color: {label.titleColor}">
                                    {label.title}
                                </span>
                            </div>
                        </div>
                    {/each}
                    {/if}
                </div>
            {/if}
            <hr>
            <h4>{I18n.t("cardStatus")}</h4>
            <div class="cardStatusHoler">
                <div class="cardStatus"
                     onclick={() => {
                         cardFilters.complete = !cardFilters.complete;
                         cardFilters.incomplete = false;
                     }}
                >
                    <input type="checkbox" checked={cardFilters.complete}>
                    <span>
                        {I18n.t("complete")}
                    </span>
                </div>
                <div class="cardStatus"
                     onclick={() => {
                          cardFilters.incomplete = !cardFilters.incomplete;
                          cardFilters.complete = false;
                     }}
                >
                    <input type="checkbox" checked={cardFilters.incomplete}>
                    <span>
                        {I18n.t("incomplete")}
                    </span>
                </div>
            </div>
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
        box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
        width: 18em;
        padding: 1em 0.5em 0.5em 0.5em;
    }

    .title {
        text-align: center;
    }

    .labelsHolder, .dueDatesHolder, .cardStatusHoler {
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        max-height: 30vh;
        overflow-y: auto;
        padding: 0 0.5em;
    }

    .labelOption, .dueDate, .cardStatus {
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
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .labelOption div:hover {
        filter: brightness(70%);
    }

    .labelOption div span {
        text-align: center;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        padding: 0 0.5em;
        width: 13em;
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
        fill: var(--main-text);
    }

    .danger {
        fill: var(--danger) !important;
    }

    .warning {
        fill: var(--warning) !important;
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
