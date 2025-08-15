<script lang="ts">
    import {slide} from "svelte/transition";
    import {clickOutside} from "../../scripts/ClickOutside";
    import SveltyPicker from "svelty-picker";
    import {I18n} from "../../scripts/I18n/I18n";
    import type {DateChange} from "svelty-picker/dist/types/internal";

    interface Props {
        clickEvent: MouseEvent;
        dueDate: string;
        setDueDate: (dueDate: string) => void; // Unfortunately we can't create a two-way binding using `$bindable()` since this component gets created using the `mount()` method which doesn't allow for two-way binding as creating a component with `<Foo bind:bar={value}/>` does. Hence the workaround using `setBar()`
        focusOnCardDetailsFunction: Function;
    }

    let {
        clickEvent,
        dueDate,
        setDueDate,
        focusOnCardDetailsFunction,
    }: Props = $props();

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
        showMenu = false;
        focusOnCardDetailsFunction(); //If we don't do this after closing the Popup, the CardDetails element wouldn't be selected (as it lost focus as soon as the Popup element was displayed). Therefore CardDetails wouldn't register the on:keydown event. Instead the Board would register that. If we would then press Escape or Ctrl+W. The board would close, whereas it should be the CardDetails element that is open that should be the one to actually close
        setDueDate(dueDate);
    }

    function onDateChange(e: DateChange)
    {
        // Close the Due Date Popup automatically when the user clears the date (`e.value === null`)
        // or finishes selecting the date and time (`e.event === "minute," indicating all fields are set), but do not close it prematurely if only the `e.event === "date"` or `e.event === "hour"` has been set.
        if (e.value === null || e.event === "minute")
        {
            closeContextMenu();
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
            <SveltyPicker todayBtn mode="datetime" clearBtn pickerOnly autocommit={true} weekStart={1} format="t" bind:value={dueDate} i18n={I18n.t("sveltyPicker")} {onDateChange}/>
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
        box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
        width: 18em;
        padding: 1em 0.5em 0.5em 0.5em;
    }

    .title {
        text-align: center;
    }

    :root {
        /* The `--sdt` related properties are for the SveltyPicker date picker */
        --sdt-bg-main: transparent;
        --sdt-shadow-color: transparent;
        --sdt-color: var(--main-text);
        --sdt-primary: var(--accent);
        --sdt-btn-bg-hover: var(--border);
        --sdt-btn-header-bg-hover: var(--border);
        --sdt-color-selected: var(--main-text);
        --sdt-today-indicator: var(--accent);
        --sdt-clock-bg: var(--border);
        --sdt-today-bg: var(--accent-button-hover);
        --sdt-today-color: white;
        --sdt-clear-color: var(--danger);
        --sdt-clear-bg: transparent;
        --sdt-clear-hover-color: white;
        --sdt-clear-hover-bg: var(--danger);
        --sdt-table-today-indicator: var(--accent);
        --sdt-bg-selected: var(--accent);
    }

    :global(.sdt-svg) {
        fill: var(--main-text) !important;
    }

    :global(.sdt-action-btn) {
        cursor: pointer;
        transition: 0.3s;
    }

    :global(.std-btn:hover), :global(.sdt-time-btn:hover) {
        background-color: var(--border) !important;
        transition: 0.3s;
    }
</style>
