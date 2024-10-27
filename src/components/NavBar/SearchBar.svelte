<script lang="ts">
    import {onMount, untrack} from "svelte";
    import {searchBarValue, selectedBoardId} from "../../scripts/Stores.svelte.js";

    let searchBar = $state();
    let containingDiv = $state();
    let searchBarIcon = $state();

    onMount(() => { //Je zou je kunnen afvragen, waarom voeg je de `.active` styleclass toe aan de `containgDiv` en `searchBarIcon` html componenten als je ze in `onMount` er dan weer direct afhaalt. i.e. direct vanaf wanneer dit component actief wordt. Dit is omdat als we de `active` styleclass niet op een component hebben staan, wordt die gestripped tijdens de build omdat die "niet gebruikt" wordt. Ookal voegen we die later toe aan de html componenten via code
        containingDiv.classList.remove("active");
        searchBarIcon.classList.remove("active");
    })

    /**
     * Het doel van deze functie is om ervoor te zorgen dat wanneer er in de searchbar wordt getypt, deze automatisch breder wordt of juist korter wanneer de gebruiker tekens uit de searchbar verwijderd.
     * korter worden => Dit doen we door de width op `auto` te zetten. Dit zorgt ervoor dat de breedte van het element kan krimpen indien de gebruiker tekst verwijderd zou hebben.
     * breder worden => Dit doen we door de width gelijk te stellen aan de scrollWidth. scrollWidth is eigenlijk de totale breedte van de tekst.
     *
     * Wanneer er zich geen tekst bevindt in de searchbar, zetten we de width op "". Dit is om de width die we geset zouden hebben via code te "undoen". An empty string will remove the inline width style set through code and allow the CSS styles to take effect again.
     *
     * ---
     *
     * Verder zorgt deze functie er ook voor dat de `.active` styleclass wordt toegevoegd aan `containingDiv` en `searchBarIcon` wanneer er tekst in de searchbar staat. Deze `active` styleclass. Zorgt ervoor dat de effecten van de searchbar die in gebruik is getoond blijven worden. Anders worden die alleen getoond wanneer er gehoverd wordt over de containgDiv/wanneer er op de searchbar gefocused is. Maar als er nog tekst instaat maar we klikken ergens anders zijn we de focus/hover kwijt. De effecten die geapplied worden zijn: containingDiv die een border krijgt + searchIcon die kleiner wordt en selected kleur krijgt.
     */
    function handleSearchBar()
    {
        if (searchBarValue.value === "")
        {
            searchBar.style.width = "";
            containingDiv.classList.remove("active");
            searchBarIcon.classList.remove("active");
        }
        else
        {
            searchBar.style.width = "auto";
            searchBar.style.width = searchBar.scrollWidth + "px";
            containingDiv.classList.add("active");
            searchBarIcon.classList.add("active");
        }
    }

    $effect(() => {
        selectedBoardId.value;
        untrack(() => {
            searchBarValue.value = ""; //Every time the selectedBoardId changes, we clear the value of the searchbar. I.e. when going from the welcome screen -> board screen, board screen -> welcome screen, board screen -> another board screen
            searchBar && handleSearchBar(); //If the `searchBar` is undefined,  `handleSearchBar()` will throw an error. Therefore the inline if
        });
    });
</script>

<div bind:this={containingDiv} class="containingDiv active">
    <svg bind:this={searchBarIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="searchIcon active">
        <path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clip-rule="evenodd" />
    </svg>
    <input bind:this={searchBar} bind:value={searchBarValue.value} oninput={handleSearchBar} class="searchBar"/>
</div>

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
        -webkit-box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
    }

    .searchBar {
        height: inherit;
        background-color: transparent;
        border: none;
        width: 0;
        transition: 0.4s ease;
    }

    .containingDiv:hover .searchBar, .searchBar:focus {
        box-shadow: none;
        width: 12em;
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