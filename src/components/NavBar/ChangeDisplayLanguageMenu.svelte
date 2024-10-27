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
    import {clickOutside} from "../../scripts/ClickOutside";
    import {I18n} from "../../scripts/I18n/I18n";

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
     * Once the user picks a display language, we need to refresh the UI in order to reflect the changes
     */
    function refreshWelcomeScreen()
    {
        location.reload();
    }

    /**
     * Sets the display language in which Takma should be displayed.
     */
    async function setDisplayLanguage(language: string)
    {
        // If the save location for the save file hasn't been set yet. I.e. when the user opened Takma for the first time and is presented the ChooseSaveLocation screen. The user still has the ability to pick a display language.
        // Which is why this function will store the language preference temporarily in the browser's local storage if that is the case. Once a save location has been set, the language preference is saved to Takma's save file.
        if (localStorage.getItem("saveDirectoryPath") === null)
        {
            localStorage.setItem("displayLanguage", language);
        }
        else
        {
            await SaveLoadManager.getData().setDisplayLanguage(language);
        }
    }

    let menuItems = [
        {
            'name': 'arabic',
            'onClick': async () => {await setDisplayLanguage("ar"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("ar")} (${I18n.t("arInAr")})`,
            'svg': ''
        },
        {
            'name': 'german',
            'onClick': async () => {await setDisplayLanguage("de"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("de")} (${I18n.t("deInDe")})`,
            'svg': ''
        },
        {
            'name': 'english',
            'onClick': async () => {await setDisplayLanguage("en"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("en")} (${I18n.t("enInEn")})`,
            'svg': ''
        },
        {
            'name': 'spanish',
            'onClick': async () => {await setDisplayLanguage("es"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("es")} (${I18n.t("esInEs")})`,
            'svg': ''
        },
        {
            'name': 'estonian',
            'onClick': async () => {await setDisplayLanguage("et"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("et")} (${I18n.t("etInEt")})`,
            'svg': ''
        },
        {
            'name': 'french',
            'onClick': async () => {await setDisplayLanguage("fr"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("fr")} (${I18n.t("frInFr")})`,
            'svg': ''
        },
        {
            'name': 'hindi',
            'onClick': async () => {await setDisplayLanguage("hi"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("hi")} (${I18n.t("hiInHi")})`,
            'svg': ''
        },
        {
            'name': 'indonesian',
            'onClick': async () => {await setDisplayLanguage("id"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("id")} (${I18n.t("idInId")})`,
            'svg': ''
        },
        {
            'name': 'japanese',
            'onClick': async () => {await setDisplayLanguage("ja"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("ja")} (${I18n.t("jaInJa")})`,
            'svg': ''
        },
        {
            'name': 'korean',
            'onClick': async () => {await setDisplayLanguage("ko"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("ko")} (${I18n.t("koInKo")})`,
            'svg': ''
        },
        {
            'name': 'dutch',
            'onClick': async () => {await setDisplayLanguage("nl"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("nl")} (${I18n.t("nlInNl")})`,
            'svg': ''
        },
        {
            'name': 'portuguese',
            'onClick': async () => {await setDisplayLanguage("pt"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("pt")} (${I18n.t("ptInPt")})`,
            'svg': ''
        },
        {
            'name': 'russian',
            'onClick': async () => {await setDisplayLanguage("ru"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("ru")} (${I18n.t("ruInRu")})`,
            'svg': ''
        },
        {
            'name': 'turkish',
            'onClick': async () => {await setDisplayLanguage("tr"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("tr")} (${I18n.t("trInTr")})`,
            'svg': ''
        },
        {
            'name': 'chinese',
            'onClick': async () => {await setDisplayLanguage("zh"); refreshWelcomeScreen();},
            'displayText': `${I18n.t("zh")} (${I18n.t("zhInZh")})`,
            'svg': ''
        },
    ].sort((a, b) => a.displayText.localeCompare(b.displayText));

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

<nav use:getContextMenuDimension style="visibility: hidden; position: absolute;"
>
    <div class="navbar">
        <ul>
            {#each menuItems as item}
                {#if item.name === "hr"}
                    <hr>
                {:else}
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
{#if showMenu}
    <nav style="position: absolute; top:{pos.y}px; left:{pos.x}px; z-index: 1; box-shadow: none"
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
                    {:else}
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
        overflow: auto;
        flex-direction: column;
        border: 1px solid rgba(var(--background-color-rgb-values), 0.4);
        -webkit-box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
        scroll-behavior: auto;
        height: 20em;
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
