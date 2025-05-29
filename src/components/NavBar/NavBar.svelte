<script lang="ts">
    import takmaIcon from "../../images/Takma.svg"
    import ThemeToggleButton from "./ThemeToggleButton.svelte";
    import {cardFilters, isSaveLocationSet, selectedBoardId, selectedCardId} from "../../scripts/Stores.svelte.js";
    import SearchBar from "./SearchBar.svelte";
    import DeleteBoardButton from "./DeleteBoardButton.svelte";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {readText, writeText} from "@tauri-apps/plugin-clipboard-manager";
    import {toast, Toaster} from "svelte-sonner";
    import OrderBoardsMenu from "./OrderBoardsMenu.svelte";
    import FilterCardsPopup from "../BoardScreen/FilterCardsPopup.svelte";
    import jam54LogoMonochrome from "../../images/Jam54LogoMonochrome.svg";
    import ChangeDisplayLanguageMenu from "./ChangeDisplayLanguageMenu.svelte";
    import startWelcomeScreenOnBoarding from "../../scripts/Onboarding";
    import {I18n} from "../../scripts/I18n/I18n";
    import DueDatesOverviewPopup from "../WelcomeScreen/DueDatesOverviewPopup.svelte";
    import PopupWindow from "../PopupWindow.svelte";
    import {open} from "@tauri-apps/plugin-shell"
    import {mount} from "svelte";
    import OrderListsMenu from "./OrderListsMenu.svelte";
    import {info} from "@tauri-apps/plugin-log";
    import {scale} from "svelte/transition";

    let showNonEssentialButtons = $state(false); // Set through `$effect` below
    $effect(() => {
        selectedBoardId.value; // Runs this $effect when the value of this variable changes

        showNonEssentialButtons = !SaveLoadManager.getData().onboardingCompleted; // Certain non-essential buttons are part of the onboarding process, therefore in case the onboarding hasn't been completed yet we should show all buttons. Otherwise if the user already completed the onboarding, hide non-essential buttons by default
    })
</script>

<div class="containingDiv">
    <div class="leftSideContainer">
        {#if !isSaveLocationSet.value}
            <img src={jam54LogoMonochrome} alt="Jam54 Logo" style="height: 2.5em"/>
        {:else}
            <img onclick={() => {
                    selectedBoardId.value = "";
                    cardFilters.labelIds = [];
                    cardFilters.dueDates = [];
                 }}
                 src={takmaIcon} alt="Takma logo" class="takmaLogo"/>
            <!--        We zetten de $boardSelected store op een lege string. Dit betekent dat ons programma dan zal teruggaan naar het welcomeScreen. Hierop klikken heeft dus een soort van back to home effect-->
        {/if}
        {#if !isSaveLocationSet.value}
            <h1 style="color: white; font-family: Inter">Jam54</h1>
        {:else if selectedBoardId.value === ""}
            <h1>Takma</h1>
        {:else}
            <input class="boardTitle" spellcheck="false" value={SaveLoadManager.getData().getBoard(selectedBoardId.value).title} oninput={e => SaveLoadManager.getData().setBoardTitle(selectedBoardId.value, e.target.value)}/>
        {/if}
    </div>
    <div class="rightSideContainer">
        {#if isSaveLocationSet.value}
            <SearchBar/>
            <!-- Due dates overview button -->
            <button class="navbarButton filledButton" title={I18n.t("dueDatesOverview")}
                    onclick={() => mount(DueDatesOverviewPopup, {target: document.body, intro: true})}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"></path></svg>
            </button>
            {#if selectedBoardId.value === ""}
                <!-- Order boards button -->
                <button class="navbarButton unfilledButton" title={I18n.t("orderBoards")}
                    onclick={e => mount(OrderBoardsMenu, {props: {clickEvent: e}, target: document.body, intro: true })}
                >
                    <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M5 5m0 .5a.5 .5 0 0 1 .5 -.5h4a.5 .5 0 0 1 .5 .5v4a.5 .5 0 0 1 -.5 .5h-4a.5 .5 0 0 1 -.5 -.5z"></path><path d="M5 14m0 .5a.5 .5 0 0 1 .5 -.5h4a.5 .5 0 0 1 .5 .5v4a.5 .5 0 0 1 -.5 .5h-4a.5 .5 0 0 1 -.5 -.5z"></path><path d="M14 15l3 3l3 -3"></path><path d="M17 18v-12"></path></svg>
                </button>
                {#if showNonEssentialButtons}
                    <!-- Web preview button -->
                    <button class="navbarButton unfilledButton" id="takmaWebPreviewButton" title={I18n.t("takmaWebPreview")} in:scale
                        onclick={() => open("https://takma.jam54.com")}
                    >
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" style="fill: currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5a2 2 0 0 0-2-2zm0 16H5V7h14v12zm-5.5-6c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zM12 9c-2.73 0-5.06 1.66-6 4 .94 2.34 3.27 4 6 4s5.06-1.66 6-4c-.94-2.34-3.27-4-6-4zm0 6.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"></path></svg>
                    </button>
                    <!-- Change save location button -->
                    <button class="navbarButton filledButton" title={I18n.t("changeSaveLocation")} in:scale
                            onclick={async () => {
                                const popup = mount(PopupWindow, {props: {title: I18n.t("confirmChangeSaveLocationTitle"), description: I18n.t("confirmChangeSaveLocationDescription", await SaveLoadManager.getSaveFilePath()), buttonType: "yesno"}, target: document.body, intro: true});

                                if (await popup.getAnswer() === true)
                                {
                                    info("Showing user 'choose save location' screen to select new save location.")
                                    isSaveLocationSet.value = false;
                                }
                            }}
                    >
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="-63 -51.2 537.6 614.4" xmlns="http://www.w3.org/2000/svg"><path d="M433.941 129.941l-83.882-83.882A48 48 0 0 0 316.118 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h352c26.51 0 48-21.49 48-48V163.882a48 48 0 0 0-14.059-33.941zM224 416c-35.346 0-64-28.654-64-64 0-35.346 28.654-64 64-64s64 28.654 64 64c0 35.346-28.654 64-64 64zm96-304.52V212c0 6.627-5.373 12-12 12H76c-6.627 0-12-5.373-12-12V108c0-6.627 5.373-12 12-12h228.52c3.183 0 6.235 1.264 8.485 3.515l3.48 3.48A11.996 11.996 0 0 1 320 111.48z"></path></svg>
                    </button>
                    <!-- Start onboarding button -->
                    <button class="navbarButton unfilledButton filledButton" title={I18n.t("beginOnboarding")} in:scale
                            onclick={async () => {
                                const popup = mount(PopupWindow, {props: {description: I18n.t("confirmRestartOnboarding"), buttonType: "yesno"}, target: document.body, intro: true});

                                if (await popup.getAnswer() === true)
                                {
                                    SaveLoadManager.getData().onboardingCompleted = false;
                                    startWelcomeScreenOnBoarding(boardId => selectedBoardId.value = boardId, cardId => selectedCardId.value = cardId);
                                }
                            }}
                    >
                        <svg style="fill: currentColor" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke-linecap="round" stroke-miterlimit="10" stroke-width="40" d="M160 164s1.44-33 33.54-59.46C212.6 88.83 235.49 84.28 256 84c18.73-.23 35.47 2.94 45.48 7.82C318.59 100.2 352 120.6 352 164c0 45.67-29.18 66.37-62.35 89.18S248 298.36 248 324"></path><circle cx="248" cy="399.99" r="32"></circle></svg>
                    </button>
                {:else}
                    <!-- Show non-essential buttons button -->
                    <button class="navbarButton filledButton" title={I18n.t("showAllButtons")}
                            onclick={() => showNonEssentialButtons = true}
                    >
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" height="2em" width="2em" xmlns="http://www.w3.org/2000/svg"><path d="M899.4 638.2h-27.198c-2.2-.6-4.2-1.6-6.4-2-57.2-8.8-102.4-56.4-106.2-112.199-4.401-62.4 31.199-115.2 89.199-132.4 7.6-2.2 15.6-3.8 23.399-5.8h27.2c1.8.6 3.4 1.6 5.4 1.8 52.8 8.6 93 46.6 104.4 98.6.8 4 2 8 3 12v27.2c-.6 1.8-1.6 3.6-1.8 5.4-8.4 52-45.4 91.599-96.801 103.6-5 1.2-9.6 2.6-14.2 3.8zM130.603 385.8l27.202.001c2.2.6 4.2 1.6 6.4 1.8 57.6 9 102.6 56.8 106.2 113.2 4 62.2-32 114.8-90.2 131.8-7.401 2.2-15 3.8-22.401 5.6h-27.2c-1.8-.6-3.4-1.6-5.2-2-52-9.6-86-39.8-102.2-90.2-2.2-6.6-3.4-13.6-5.2-20.4v-27.2c.6-1.8 1.6-3.6 1.8-5.4 8.6-52.2 45.4-91.6 96.8-103.6 4.8-1.201 9.4-2.401 13.999-3.601zm370.801.001h27.2c2.2.6 4.2 1.6 6.4 2 57.4 9 103.6 58.6 106 114.6 2.8 63-35.2 116.4-93.8 131.4-6.2 1.6-12.4 3-18.6 4.4h-27.2c-2.2-.6-4.2-1.6-6.4-2-57.4-8.8-103.601-58.6-106.2-114.6-3-63 35.2-116.4 93.8-131.4 6.4-1.6 12.6-3 18.8-4.4z"></path></svg>
                    </button>
                {/if}
            {:else}
                <!-- Order lists button -->
                <button class="navbarButton unfilledButton" title={I18n.t("orderLists")}
                        onclick={e => mount(OrderListsMenu, {props: {clickEvent: e}, target: document.body, intro: true })}
                >
                    <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M5 5m0 .5a.5 .5 0 0 1 .5 -.5h4a.5 .5 0 0 1 .5 .5v4a.5 .5 0 0 1 -.5 .5h-4a.5 .5 0 0 1 -.5 -.5z"></path><path d="M5 14m0 .5a.5 .5 0 0 1 .5 -.5h4a.5 .5 0 0 1 .5 .5v4a.5 .5 0 0 1 -.5 .5h-4a.5 .5 0 0 1 -.5 -.5z"></path><path d="M14 15l3 3l3 -3"></path><path d="M17 18v-12"></path></svg>
                </button>
                <!-- Filters button -->
                <button class="navbarButton filledButton" title={I18n.t("filterCards")}
                        onclick={e => mount(FilterCardsPopup, {props: {clickEvent: e}, target: document.body, intro: true})}
                >
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M472 168H40a24 24 0 010-48h432a24 24 0 010 48zm-80 112H120a24 24 0 010-48h272a24 24 0 010 48zm-96 112h-80a24 24 0 010-48h80a24 24 0 010 48z"></path></svg>
                </button>
                <!-- Copy link button -->
                <button class="navbarButton unfilledButton" title={I18n.t("copyThisBoardLink")}
                        onclick={async () => {
                         let linkToThisBoard = `takma://${selectedBoardId.value}`
                         await writeText(linkToThisBoard);

                         let textInClipboard = await readText();
                         if (textInClipboard === linkToThisBoard)
                         {
                             toast(I18n.t("boardLinkCopiedToClipboard"))
                         }
                         else
                         {
                             toast.error(I18n.t("clipboardCopyBoardErrorLink") + linkToThisBoard);
                         }
                    }}
                >
                    <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                </button>
                <DeleteBoardButton/>
            {/if}
        {/if}
        {#if selectedBoardId.value === "" && (showNonEssentialButtons || !isSaveLocationSet.value)}
            <!-- I18n button -->
            <button class="navbarButton filledButton" title={I18n.t("changeDisplayLanguage")} in:scale
                    onclick={e => mount(ChangeDisplayLanguageMenu, {props: {clickEvent: e}, target: document.body, intro: true})}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M478.33 433.6l-90-218a22 22 0 00-40.67 0l-90 218a22 22 0 1040.67 16.79L316.66 406h102.67l18.33 44.39A22 22 0 00458 464a22 22 0 0020.32-30.4zM334.83 362L368 281.65 401.17 362zm-66.99-19.08a22 22 0 00-4.89-30.7c-.2-.15-15-11.13-36.49-34.73 39.65-53.68 62.11-114.75 71.27-143.49H330a22 22 0 000-44H214V70a22 22 0 00-44 0v20H54a22 22 0 000 44h197.25c-9.52 26.95-27.05 69.5-53.79 108.36-31.41-41.68-43.08-68.65-43.17-68.87a22 22 0 00-40.58 17c.58 1.38 14.55 34.23 52.86 83.93.92 1.19 1.83 2.35 2.74 3.51-39.24 44.35-77.74 71.86-93.85 80.74a22 22 0 1021.07 38.63c2.16-1.18 48.6-26.89 101.63-85.59 22.52 24.08 38 35.44 38.93 36.1a22 22 0 0030.75-4.9z"></path></svg>
            </button>
        {/if}
        <ThemeToggleButton/>
    </div>
</div>
{#key [selectedBoardId.value, selectedCardId.value]}
    <!--This makes it so that if the user toggles the color theme. The toast will use the correct color. Now this change will only be reflected if either the selected board/card changes. This is the best we can do, since we can't listen for a color theme changed event-->
    <Toaster richColors theme={document.documentElement.style.getPropertyValue("color-scheme")}/>
{/key}

<style>
    .containingDiv {
        display: flex;
        flex-flow: row nowrap;
        align-items: center;
        justify-content: space-between;
        height: 2em;

        padding: 0.25em 0 0.5em 0;
        transition: 0.4s;

        background: transparent;
    }

    .leftSideContainer {
        height: inherit;
        display: flex;
        align-items: center;
        gap: 0.5em;
        flex-grow: 1;
        padding: 0 0.5em;
    }

    h1 {
        font-family: Nunito, sans-serif;
    }

    .takmaLogo {
        height: inherit;
        cursor: pointer;
        transition: 0.3s;
        -webkit-filter: drop-shadow(0 0 3px rgba(0, 0, 0, .35));
    }

    .takmaLogo:hover {
        transform: scale(105%);
    }

    .rightSideContainer {
        display: flex;
        flex-flow: row nowrap;
        align-items: center;
        justify-content: space-between;
        height: inherit;
        gap: 0.5em;
        overflow: hidden;
        padding: 1em 0.5em;
    }

    .navbarButton {
        height: inherit;
        width: auto;
        margin: 0;
        background-color: transparent;
        padding: 0;
        border: none;
    }

    .navbarButton svg {
        transition: 0.5s;
        height: inherit;
        cursor: pointer;
        fill: var(--unselected-button);
        -webkit-filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, .35));
    }

    .unfilledButton svg {
        fill: none;
        color: var(--unselected-button);
    }

    .unfilledButton:hover svg {
        color: var(--selected-button);
    }

    .filledButton:hover svg {
        fill: var(--selected-button);
    }

    .boardTitle {
        background-color: transparent;
        border: none;
        border-radius: 8px;
        font-size: 2em;
        font-family: Nunito, sans-serif;
        font-weight: bold;
        padding: 0;
        flex-grow: 1;
        -webkit-filter: drop-shadow( 0 0 10px rgba(var(--background-color-rgb-values), .75));
        height: 1.25em;
        text-overflow: ellipsis;
    }
</style>