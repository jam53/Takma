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
    import {
        cardFilters,
        invalidateLabels,
        selectedBoardId,
    } from "../../scripts/Stores.svelte.js";
    import type {Label} from "../../scripts/Board";
    import {I18n} from "../../scripts/I18n/I18n";
    import {info} from "@tauri-apps/plugin-log";
    import {mount} from "svelte";
    import PopupWindow from "../PopupWindow.svelte";

    interface Props {
        clickEvent: MouseEvent;
        labelIds: string[];
        setLabelIds: (labelIds: string[]) => void; // Unfortunately we can't create a two-way binding using `$bindable()` since this component gets created using the `mount()` method which doesn't allow for two-way binding as creating a component with `<Foo bind:bar={value}/>` does. Hence the workaround using `setBar()`
        focusOnCardDetailsFunction: Function;
        reloadLists: () => void;
    }

    let {
        clickEvent,
        labelIds,
        setLabelIds,
        focusOnCardDetailsFunction,
        reloadLists,
    }: Props = $props();

    let lastPickedColor: string;  //The last color that was selected using the color picker. Represents a color value which can be used in css, could be a hexidecimal color value including #, "red", rgba(100, 1, 1, 1), etc.
    document.addEventListener('coloris:pick', event => lastPickedColor = event.detail.color);

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
        info(`Opening labels popup in board:${selectedBoardId.value} with the following labels: "${labelIds}"`);
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
        //This makes it so we don't close the LabelsPopup whilst the color picker is open. Clickoutside would fire and cause this function to be executed when we click on the color picker, since the color picker is a separate object in the DOM and not part of the LabelsPopup
        if (document.querySelector(".clr-open") === null)
        {
            // To make context menu disappear when
            // mouse is clicked outside context menu
            showMenu = false;
            focusOnCardDetailsFunction(); //If we don't do this after closing the LabelsPopup, the CardDetails element wouldn't be selected (as it lost focus as soon as the LabelsPopup element was displayed). Therefore CardDetails wouldn't register the on:keydown event. Instead the Board would register that. If we would then press Escape or Ctrl+W. The board would close, whereas it should be the CardDetails element that is open that should be the one to actually close
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

    /**
     * When we click on a label, this function adds/removes the label from the card depending on whether or not the label was/wasn't assigned to the card before clicking.
     */
    function handleLabelClick(clickedLabelId: string)
    {
        if (labelIds.includes(clickedLabelId))
        {
            labelIds = labelIds.filter(labelId => labelId != clickedLabelId); //Removes the clicked label from the card
        }
        else //The clicked label wasn't assigned to the card yet, so we add it here
        {
            labelIds.push(clickedLabelId);
        }

        setLabelIds(labelIds);
    }

    function createNewLabel()
    {
        const newLabelId = crypto.randomUUID();

        //region add label to board
        const newLabel: Label = {
            id: newLabelId,
            color: lastPickedColor,
            title: "",
            titleColor: calculateLabelTitleColor(lastPickedColor)
        };
        SaveLoadManager.getData().addLabelToBoard(selectedBoardId.value, newLabel);
        //endregion

        labelIds.push(newLabelId); // Add label to this card
        setLabelIds(labelIds);

        closeContextMenu();
    }

    function editLabelColor(labelId: string)
    {
        const labelTitleColor = calculateLabelTitleColor(lastPickedColor);
        SaveLoadManager.getData().editLabelColor(selectedBoardId.value, labelId, lastPickedColor, labelTitleColor);

        document.getElementById(`colorInput${labelId}`).style.color = labelTitleColor; //Sets the updated color in the labelsPopup UI
        document.getElementById(`colorInput${labelId}`).style.backgroundColor = lastPickedColor; //Sets the updated color in the labelsPopup UI

        invalidateLabels.value = !invalidateLabels.value;
    }

    /**
     * Given the color of a label, this function returns a new color that can be used for the title of that label.
     * This color is chosen in such a way that it readable when put over the label color. But the color of the label is still retained, just lighter/darker. It doesn't just return black or white e.g.
     */
    function calculateLabelTitleColor(labelColor: string): string
    {
        const hslColor = htmlColorToHsl(labelColor);
        const lightnessDifference = 40; //The amount that will be used to increase/decrease the lightness by

        if (hslColor.lightness > lightnessDifference)
        {
            hslColor.lightness -= lightnessDifference;
        }
        else
        {
            hslColor.lightness += lightnessDifference;
        }

        return "hsl(" + hslColor.hue + "," + hslColor.saturation + "%," + hslColor.lightness + "%)";
    }

    /**
     * This function converts any "html color" i.e. "red", "#ff0000", rgb(255,0,0), hsl(0, 100%, 50%), etc.
     * to HSL. Technically it would be better to write separate functions for rgb->hsl, hex->hsl and so on. But by using the approach below where we create an element and get the color from that element, we just need a single functions.
     *
     * https://css-tricks.com/converting-color-spaces-in-javascript/#aa-built-in-names
     *
     * @param color any html color (rgb, rgba, hex, hsl, hsla or a build in html color name)
     * @returns an object with 3 properties; hue, saturation and lightness
     */
    function htmlColorToHsl(color)
    {
        let fakeDiv = document.createElement("div");
        fakeDiv.style.color = color;
        document.body.appendChild(fakeDiv);

        let cs = window.getComputedStyle(fakeDiv),
            pv = cs.getPropertyValue("color");

        document.body.removeChild(fakeDiv);

        // Code ripped from RGBToHSL() (except pv is substringed)
        let rgb = pv.substr(4).split(")")[0].split(","),
            r = rgb[0] / 255,
            g = rgb[1] / 255,
            b = rgb[2] / 255,
            cmin = Math.min(r,g,b),
            cmax = Math.max(r,g,b),
            delta = cmax - cmin,
            h = 0,
            s = 0,
            l = 0;

        if (delta == 0)
            h = 0;
        else if (cmax == r)
            h = ((g - b) / delta) % 6;
        else if (cmax == g)
            h = (b - r) / delta + 2;
        else
            h = (r - g) / delta + 4;

        h = Math.round(h * 60);

        if (h < 0)
            h += 360;

        l = (cmax + cmin) / 2;
        s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
        s = +(s * 100).toFixed(1);
        l = +(l * 100).toFixed(1);

        return {hue: h, saturation: s, lightness: l};
    }

    /**
     * Deletes a label from the board and from all the cards to which the label has been assigned
     * @param labelId
     */
    async function deleteLabel(labelId: string)
    {
        const deleteLabelFunction = () => {
            SaveLoadManager.getData().removeLabel(selectedBoardId.value, labelId);
            cardFilters.labelIds = cardFilters.labelIds.filter(id => id !== labelId);
            labelIds = labelIds.filter(id => id !== labelId);
            setLabelIds(labelIds);
            reloadLists(); // Otherwise changes won't be reflected in other cards that had the label that we deleted.
        }

        if (!SaveLoadManager.getData().showConfirmationPreferences.deleteLabel)
        {
            deleteLabelFunction();
        }
        else
        {
            closeContextMenu();

            const popup = mount(PopupWindow, {props: {description: I18n.t("confirmLabelRemoval"), buttonType: "yesno", showConfirmation: true}, target: document.body, intro: true});

            if (await popup.getAnswer() === true)
            {
                await SaveLoadManager.getData().updateConfirmationPreference("deleteLabel", popup.getShowConfirmationAgain());
                deleteLabelFunction();
            }
        }
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
                {I18n.t("labels")}
            </h3>
            <br>
            <div class="labelsHolder">
                {#key labelIds}
                    {#each SaveLoadManager.getData().getBoard(selectedBoardId.value).labels as label}
                        <div class="labelOption">
                            <input type="checkbox" checked={labelIds.includes(label.id)}
                                 onclick={() => handleLabelClick(label.id)}/>
                            <input id={`colorInput${label.id}`} style="color: {label.titleColor}; background-color: {label.color}" class="label" placeholder={I18n.t("enterTitle")}
                                bind:value={label.title} oninput={_ => {
                                    SaveLoadManager.getData().setLabelTitle(selectedBoardId.value, label.id, label.title);
                                    invalidateLabels.value = !invalidateLabels.value;
                                }}/>
                            <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"
                                 onclick={() => document.getElementById(label.id).click()}
                            ><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            <input id={label.id} value={label.color} onchange={() => editLabelColor(label.id)} class="coloris instance1" style="width: 0; height: 0; border: none; position: absolute"/>
    <!--When we add the `coloris instance1` styleclasses to an `input` or `button`, the color picker will be shown when we click on them. Unfortunately when they contain an svg, the color picker doesn't show up. That's why we have an invisible input here. When we click on the svg, we will programmatically click the input field, thus showing the color picker-->
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                 onclick={() => deleteLabel(label.id)}
                            >
                                <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clip-rule="evenodd" />
                            </svg>
                        </div>
                    {/each}
                {/key}
            </div>
            <br>
            <button class="createNewLabelButton coloris instance1"
                    onchange={createNewLabel}
            >
<!--When clicking on this  button, the color picker will automatically be opened-->
                {I18n.t("createNewLabel")}
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
        min-width: 18em;
        display: inline-flex;
        background-color: var(--background-color);
        backdrop-filter: blur(10px);
        border-radius: 5px;
        overflow: hidden;
        flex-direction: column;
        border: 1px solid rgba(var(--background-color-rgb-values), 0.4);
        box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
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
        padding: 0.5em;
    }

    .labelOption {
        display: flex;
        align-items: center;
        gap: 1em;
    }

    .label {
        width: 100%;
        height: 2em;
        border-radius: 5px;
        cursor: text;
        transition: 0.2s;
        padding: 0 0.5em;
        border: none;
    }

    .label:hover {
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
        transition: 0.2s;
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

    [type=checkbox]:checked:hover {
        filter: brightness(70%);
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
