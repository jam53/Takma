<script lang="ts">
    import {slide} from "svelte/transition";
    import {clickOutside} from "../../scripts/ClickOutside";
    import SveltyPicker from "svelty-picker";
    import {I18n} from "../../scripts/I18n/I18n";
    import type {Card} from "../../scripts/Board";
    import {info} from "@tauri-apps/plugin-log";

    interface Props {
        clickEvent: MouseEvent;
        cardToSave: Card;
        focusOnCardDetailsFunction: Function;
        saveCardFunction: Function;
    }

    let {
        clickEvent,
        cardToSave = $bindable(),
        focusOnCardDetailsFunction,
        saveCardFunction
    }: Props = $props();

    const initialDueDate = cardToSave.dueDate;

    // pos is cursor position when right click occur
    let pos = $state({x: 0, y: 0});
    // menu is dimension (height and width) of context menu
    let menu = {h: 0, w: 0};
    // browser/window dimension (height and width)
    let browser = {w: 0, h: 0};
    // showMenu is state of context-menu visibility
    let showMenu = $state(true);

    function openContextMenu(e: MouseEvent)
    {
        info("Opening due date popup for card:" + cardToSave.id);
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
        //This makes it so we don't close the LabelsPopup whilst the color picker is open. Clickoutside would fire and cause this function to be executed when we click on the color picker, since the color picker is a seperate object in the DOM and not part of the LabelsPopup
        if (document.querySelector(".clr-open") === null)
        {
            // To make context menu disappear when
            // mouse is clicked outside context menu
            showMenu = false;
            focusOnCardDetailsFunction(); //If we don't do this after closing the LabelsPopup, the CardDetails element wouldn't be selected (as it lost focus as soon as the LabelsPopup element was displayed). Therefore CardDetails wouldn't register the on:keydown event. Instead the Board would register that. If we would then press Escape or Ctrl+W. The board would close, whereas it should be the CardDetails element that is open that should be the one to actually close
            saveCardFunction();
        }
    }

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

    let navElement: HTMLElement | null = $state(null);
    $effect(() => {
        navElement?.focus();
    }); //If we don't focus on the navElement, i.e. the container of this popup, then we won't be able to detect the on:keydown event
    $effect(() => {
        if (initialDueDate !== cardToSave.dueDate)
        {//If the cardToSave.dueDate no longer equals its initial value, this means the user picked a new due date/removed the existing due date. Therefore we can close this DueDatePopup
            closeContextMenu();
        }
    });

    function handleKeyDown(e: KeyboardEvent)
    {
        e.stopPropagation();
        if(e.key === "Escape" || (e.key.toLowerCase() === "w" && e.ctrlKey))
        {
            closeContextMenu();
        }
    }
</script>

{#if showMenu}
    <nav use:getContextMenuDimension style="position: absolute; top:{pos.y}px; left:{pos.x}px; z-index: 1; box-shadow: none;"
         use:clickOutside
         onclick_outside={closeContextMenu}
         bind:this={navElement}
         onkeydown={handleKeyDown} tabindex="1"
    >
        <div class="navbar" id="navbar" transition:slide|global>
            <h3 class="title">
                {I18n.t("dueDate")}
            </h3>
            <br>
            <SveltyPicker todayBtn mode="datetime" clearBtn pickerOnly autocommit={true} weekStart={1} format="t" bind:value={cardToSave.dueDate} i18n={I18n.t("sveltyPicker")}/>
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
</style>
