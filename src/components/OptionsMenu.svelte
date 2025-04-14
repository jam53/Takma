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

<!-- This is a reusable "context menu display" component. It's designed to be instantiated by a parent component when a context menu is needed (typically triggered by a right-click event captured by the parent). The parent provides the original MouseEvent (as `clickEvent` for positioning) and an array (`menuItems`) defining the menu's options, dividers, and associated click actions. This component then handles rendering the menu visually, calculating its position near the cursor while accounting for screen edges, and managing its dismissal (via click-outside or keyboard shortcuts like Escape). -->

<script lang="ts">
    import {clickOutside} from "../scripts/ClickOutside";
    import {slide} from "svelte/transition";
    import {info} from "@tauri-apps/plugin-log";
    import {copiedBoard} from "../scripts/Stores.svelte";

    interface Props {
        clickEvent: MouseEvent;
        logMessage: string;
        menuItems: MenuItem[];
    }

    let { clickEvent, logMessage, menuItems }: Props = $props();

    interface MenuItem {
        name: string;
        onClick?: () => void;
        displayText?: string;
        // Optional function to control visibility.
        // Item is visible by default unless this function is provided and returns `false`.
        isVisibleFunction?: () => boolean;
        svg?: string;
    }

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
        info(logMessage);
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

    export function closeContextMenu()
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
    <nav style="position: absolute; top:{pos.y}px; left:{pos.x}px; z-index: 1; box-shadow: none"
         use:getContextMenuDimension
         use:clickOutside
         onclick_outside={closeContextMenu}
         bind:this={navElement}
         onkeydown={handleKeyDown} tabindex="1"
    >
        <div class="navbar" id="navbar" transition:slide|global>
            <ul>
                {#each menuItems as item}
                    {#if item.name === "hr"}
                        <hr>
                    {:else if item.isVisibleFunction === undefined || (item.isVisibleFunction && item.isVisibleFunction())}
                        <li>
                            <button onclick={item.onClick}>
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
