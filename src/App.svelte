<script lang="ts">
    import "./stylesheets/styles.css"
    import "./stylesheets/fonts.css"
    import WelcomeScreen from "./components/WelcomeScreen/WelcomeScreen.svelte";
    import {SaveLoadManager} from "./scripts/SaveLoad/SaveLoadManager";
    import NavBar from "./components/NavBar/NavBar.svelte";
    import {selectedBoardId} from "./scripts/stores";
    import BoardScreen from "./components/BoardScreen/BoardScreen.svelte";
</script>

<main>
{#await SaveLoadManager.loadSaveFileFromDisk()}
    <h1>%%Loading savefile</h1>
{:then _}
    <NavBar/>
    {#if $selectedBoardId === ""}
        <WelcomeScreen/>
    {:else}
        <BoardScreen/>
    {/if}
{/await}
</main>

<style>
    :global(body) {
        transition: 0.4s;
        background-color: var(--background-color);
    }
</style>