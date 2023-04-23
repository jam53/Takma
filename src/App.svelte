<script lang="ts">
    import "./stylesheets/styles.css"
    import WelcomeScreen from "./components/WelcomeScreen.svelte";
    import {SaveLoadManager} from "./scripts/SaveLoad/SaveLoadManager";
    import NavBar from "./components/NavBar/NavBar.svelte";
</script>

<main>
{#await SaveLoadManager.loadSaveFileFromDisk()}
    <h1>%Loading savefile</h1>
{:then _}
    <NavBar/>
    <WelcomeScreen/>
{/await}
</main>

<style>
    :global(body) {
        background-color: var(--background-color-white);
    }

    :global(body.darkTheme) {
        background-color: var(--background-color-dark);
    }
</style>