<script lang="ts">
    import {untrack} from "svelte";
    import {searchBarValue, selectedBoardId} from "../../scripts/Stores.svelte.js";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {toast} from "svelte-sonner";
    import {I18n} from "../../scripts/I18n/I18n";
    import SearchBox from "./SearchBox.svelte";

    let searchBar: HTMLInputElement = $state();
    let containingDiv: HTMLElement = $state();
    let searchBarIcon: HTMLElement = $state();
    let showSearchBox = $state(false);

    function collapseSearchBar()
    {
        searchBar.style.width = "";
        containingDiv.classList.remove("active");
        searchBarIcon.classList.remove("active");

        searchBarValue.value = "";
        searchBar.blur();

        showSearchBox = false;
    }

    function showSearchBar()
    {
        containingDiv.classList.add("active");
        searchBarIcon.classList.add("active");

        searchBar.focus();
        searchBar.select();

        showSearchBox = selectedBoardId.value === ""; // Don't show search box on board screen, only on welcome screen
    }

    $effect(() => {
        selectedBoardId.value;
        untrack(() => {
            collapseSearchBar(); //Every time the selectedBoardId changes, we clear the value of the searchbar. I.e. when going from the welcome screen -> board screen, board screen -> welcome screen, board screen -> another board screen
        });
    });

    window.addEventListener("keydown", handleKeyDown);

    function handleKeyDown(e: KeyboardEvent)
    {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "f" && SaveLoadManager.getData().onboardingCompleted)
        {
            showSearchBar();
        }
        else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "f" && !SaveLoadManager.getData().onboardingCompleted)
        {
            toast(I18n.t("shortcutNotAvailableDuringOnboarding"));
        }
        else if (e.key.toLowerCase() === "escape" && SaveLoadManager.getData().onboardingCompleted)
        {
            collapseSearchBar();
            e.stopPropagation();
        }
    }
</script>

<div bind:this={containingDiv} class="containingDiv active">
    <svg bind:this={searchBarIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="searchIcon active">
        <path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clip-rule="evenodd" />
    </svg>
    <input class="searchBar"
           bind:this={searchBar}
           bind:value={searchBarValue.value}
           onchange={showSearchBar}
           onfocus={showSearchBar}
           onkeydown={handleKeyDown}
           onblur={() => searchBarValue.value === "" && collapseSearchBar()}
    />
</div>
<SearchBox {showSearchBox} closeSearchBar={collapseSearchBar}/>

<style>
    .containingDiv {
        height: inherit;
        display: flex;
        border: transparent 0 solid;
        transition: 0.4s;
    }

    .containingDiv:hover, .containingDiv:focus-within, .containingDiv.active {
        border: var(--unselected-button) 1px solid;
        border-radius: 0.75em;
        background-color: rgba(var(--background-color-rgb-values), 0.5);
        backdrop-filter: blur(5px);
        box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
    }

    .searchBar {
        height: inherit;
        background-color: transparent;
        border: none;
        width: 0;
        min-width: 0;
        transition: 0.4s ease;
        field-sizing: content;
    }

    .containingDiv:hover .searchBar, .containingDiv:focus-within .searchBar, .containingDiv.active .searchBar, .searchBar:focus {
        box-shadow: none;
        width: auto;
        min-width: 12em;
    }

    .searchIcon {
        height: 100%;
        fill: var(--unselected-button);
        stroke: var(--unselected-button);
        stroke-width: 1px;
        cursor: pointer;
        padding: 0;
        transition: 0.5s;
        -webkit-filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, .35));
    }

    .containingDiv:hover .searchIcon, .containingDiv:focus-within .searchIcon, .searchIcon.active {
        fill: var(--selected-button);
        stroke: var(--selected-button);
        height: auto;
        padding: 5px;
    }
</style>