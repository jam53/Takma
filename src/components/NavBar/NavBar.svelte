<script lang="ts">
    import takmaIcon from "../../images/Takma.svg"
    import ThemeToggleButton from "./ThemeToggleButton.svelte";
    import {cardFilters, selectedBoardId, selectedCardId} from "../../scripts/stores";
    import SearchBar from "./SearchBar.svelte";
    import DeleteBoardButton from "./DeleteBoardButton.svelte";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {readText, writeText} from "@tauri-apps/api/clipboard";
    import {toast, Toaster} from "svelte-sonner";
    import OrderBoardsMenu from "./OrderBoardsMenu.svelte";
    import FilterCardsPopup from "../BoardScreen/FilterCardsPopup.svelte";
    import jam54LogoMonochrome from "../../images/Jam54LogoMonochrome.svg";
    import ChangeDisplayLanguageMenu from "./ChangeDisplayLanguageMenu.svelte";
    import startWelcomeScreenOnBoarding from "../../scripts/Onboarding";
    import {I18n} from "../../scripts/I18n/I18n";
    import DueDatesOverviewPopup from "../WelcomeScreen/DueDatesOverviewPopup.svelte";
    import PopupWindow from "../PopupWindow.svelte";

    let orderBoardsMenuElement;
    let filterCardsPopupElement;
    let changeDisplayLanguageMenuElement;
</script>

<div class="containingDiv">
    <div class="leftSideContainer">
        {#if localStorage.getItem("saveLocation") === null}
            <img src={jam54LogoMonochrome} alt="Jam54 Logo" style="height: 2.5em"/>
        {:else}
            <img on:click={() => {
                    $selectedBoardId = "";
                    $cardFilters = {labelIds: [], dueDates: []};
                 }}
                 src={takmaIcon} alt="Takma logo" class="takmaLogo"/>
            <!--        We zetten de $boardSelected store op een lege string. Dit betekent dat ons programma dan zal teruggaan naar het welcomeScreen. Hierop klikken heeft dus een soort van back to home effect-->
        {/if}
        {#if localStorage.getItem("saveLocation") === null}
            <h1 style="color: white; font-family: Inter">Jam54</h1>
        {:else if $selectedBoardId === ""}
            <h1>Takma</h1>
        {:else}
            <input class="boardTitle" value={SaveLoadManager.getData().getBoard($selectedBoardId).title} on:input={e => SaveLoadManager.getData().setBoardTitle($selectedBoardId, e.target.value)}/>
        {/if}
    </div>
    <div class="rightSideContainer">
        {#if localStorage.getItem("saveLocation") !== null}
            <SearchBar/>
            <button class="dueDatesOverviewButton" title={I18n.t("dueDatesOverview")}
                    on:click={() => new DueDatesOverviewPopup({target: document.body, intro: true})}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"></path></svg>
            </button>
            {#if $selectedBoardId === ""}
                <button class="orderBoardsButton" title={I18n.t("orderBoards")}
                        on:click={e => orderBoardsMenuElement.openContextMenu(e)}
                >
                    <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M5 5m0 .5a.5 .5 0 0 1 .5 -.5h4a.5 .5 0 0 1 .5 .5v4a.5 .5 0 0 1 -.5 .5h-4a.5 .5 0 0 1 -.5 -.5z"></path><path d="M5 14m0 .5a.5 .5 0 0 1 .5 -.5h4a.5 .5 0 0 1 .5 .5v4a.5 .5 0 0 1 -.5 .5h-4a.5 .5 0 0 1 -.5 -.5z"></path><path d="M14 15l3 3l3 -3"></path><path d="M17 18v-12"></path></svg>
                </button>
                <button class="startOnboarding" title={I18n.t("beginOnboarding")}
                        on:click={async () => {
                            const popup = new PopupWindow({props: {description: I18n.t("confirmRestartOnboarding"), buttonType: "yesno"}, target: document.body, intro: true});

                            if (await popup.getAnswer() === true)
                            {
                                SaveLoadManager.getData().onboardingCompleted = false;
                                startWelcomeScreenOnBoarding(boardId => $selectedBoardId = boardId, cardId => $selectedCardId = cardId);
                            }
                        }}
                >
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke-linecap="round" stroke-miterlimit="10" stroke-width="40" d="M160 164s1.44-33 33.54-59.46C212.6 88.83 235.49 84.28 256 84c18.73-.23 35.47 2.94 45.48 7.82C318.59 100.2 352 120.6 352 164c0 45.67-29.18 66.37-62.35 89.18S248 298.36 248 324"></path><circle cx="248" cy="399.99" r="32"></circle></svg>
                </button>
            {:else}
                <button class="filterButton" title={I18n.t("filterCards")}
                        on:click={e => filterCardsPopupElement.openContextMenu(e)}
                >
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M472 168H40a24 24 0 010-48h432a24 24 0 010 48zm-80 112H120a24 24 0 010-48h272a24 24 0 010 48zm-96 112h-80a24 24 0 010-48h80a24 24 0 010 48z"></path></svg>
                </button>
                <button class="copyLinkButton" title={I18n.t("copyThisBoardLink")}
                        on:click={async () => {
                         let linkToThisBoard = `takma://${$selectedBoardId}`
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
        {#if $selectedBoardId === ""}
            <button class="i18nButton" title={I18n.t("changeDisplayLanguage")}
                    on:click={e => changeDisplayLanguageMenuElement.openContextMenu(e)}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M478.33 433.6l-90-218a22 22 0 00-40.67 0l-90 218a22 22 0 1040.67 16.79L316.66 406h102.67l18.33 44.39A22 22 0 00458 464a22 22 0 0020.32-30.4zM334.83 362L368 281.65 401.17 362zm-66.99-19.08a22 22 0 00-4.89-30.7c-.2-.15-15-11.13-36.49-34.73 39.65-53.68 62.11-114.75 71.27-143.49H330a22 22 0 000-44H214V70a22 22 0 00-44 0v20H54a22 22 0 000 44h197.25c-9.52 26.95-27.05 69.5-53.79 108.36-31.41-41.68-43.08-68.65-43.17-68.87a22 22 0 00-40.58 17c.58 1.38 14.55 34.23 52.86 83.93.92 1.19 1.83 2.35 2.74 3.51-39.24 44.35-77.74 71.86-93.85 80.74a22 22 0 1021.07 38.63c2.16-1.18 48.6-26.89 101.63-85.59 22.52 24.08 38 35.44 38.93 36.1a22 22 0 0030.75-4.9z"></path></svg>
            </button>
        {/if}
        <ThemeToggleButton/>
    </div>
</div>
{#key [$selectedBoardId, $selectedCardId]}
    <!--This makes it so that if the user toggles the color theme. The toast will use the correct color. Now this change will only be reflected if either the selected board/card changes. This is the best we can do, since we can't listen for a color theme changed event-->
    <Toaster richColors theme={document.documentElement.style.getPropertyValue("color-scheme")}/>
{/key}
<OrderBoardsMenu bind:this={orderBoardsMenuElement}/>
<FilterCardsPopup bind:this={filterCardsPopupElement}/>
<ChangeDisplayLanguageMenu bind:this={changeDisplayLanguageMenuElement}/>

<style>
    .containingDiv {
        display: flex;
        flex-flow: row nowrap;
        align-items: center;
        justify-content: space-between;
        height: 2em;

        padding: 0.5em;
        transition: 0.4s;

        background: transparent;
    }

    .leftSideContainer {
        height: inherit;
        display: flex;
        align-items: center;
        gap: 0.5em;
        flex-grow: 1;
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
    }

    .i18nButton, .copyLinkButton, .orderBoardsButton, .filterButton, .startOnboarding, .dueDatesOverviewButton {
        height: inherit;
        width: auto;
        margin: 0;
        background-color: transparent;
        padding: 0;
        border: none;
    }

    .i18nButton svg, .copyLinkButton svg, .orderBoardsButton svg, .filterButton svg, .startOnboarding svg, .dueDatesOverviewButton svg {
        transition: 0.5s;
        height: inherit;
        cursor: pointer;
        fill: var(--unselected-button);
        -webkit-filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, .35));
    }

    .copyLinkButton svg, .orderBoardsButton svg {
        fill: none;
        color: var(--unselected-button);
    }

    .startOnboarding svg {
        color: var(--unselected-button);
    }

    .i18nButton:hover svg, .filterButton:hover svg, .startOnboarding:hover svg, .dueDatesOverviewButton:hover svg {
        fill: var(--selected-button);
    }

    .copyLinkButton:hover svg, .orderBoardsButton:hover svg, .startOnboarding:hover svg {
        color: var(--selected-button);
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
    }
</style>