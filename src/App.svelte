<script lang="ts">
    import "./stylesheets/styles.css"
    import "./stylesheets/fonts.css"
    import WelcomeScreen from "./components/WelcomeScreen/WelcomeScreen.svelte";
    import {SaveLoadManager} from "./scripts/SaveLoad/SaveLoadManager";
    import NavBar from "./components/NavBar/NavBar.svelte";
    import {selectedBoardId} from "./scripts/stores";
    import BoardScreen from "./components/BoardScreen/BoardScreen.svelte";
    import type {Board} from "./scripts/Board";
    import {getImageUrl} from "./scripts/GetImageUrl";
    import {appWindow} from "@tauri-apps/api/window";


    applyMaximizedNotMaximizedStyleClasses();
    appWindow.onResized(() =>
    {
        applyMaximizedNotMaximizedStyleClasses();
    });

    async function applyMaximizedNotMaximizedStyleClasses()
    {
        let isMaximized = await appWindow.isMaximized();

        if (isMaximized)
        {
            document.getElementById("main").classList.remove("wrapperNotMaximized");
        }
        else
        {
            document.getElementById("main").classList.add("wrapperNotMaximized");
        }
    }
</script>

<main class="wrapper wrapperNotMaximized" id="main">
{#await SaveLoadManager.loadSaveFileFromDisk()}
    <h1>%%Loading savefile</h1>
{:then _}
    <NavBar/>
    <div class="scroll-container">
        {#if $selectedBoardId === ""}
            <WelcomeScreen/>
        {:else}
            <BoardScreen/>
        {/if}
    </div>
{/await}
</main>

<style>
    .wrapper {
        height: 100vh;
        border: none;
        position: relative;
    }

    .wrapperNotMaximized { /* Gets applied in index.html*/
        height: calc(100vh - 4px - 30px - 2em); /* 100vh - the borderwidth in the `.bodyNotMaximized` styleclass in `index.html` - height title bar in the `.titlebar` styleclass in `index.html` - navbar height in the `.containingDiv` styleclass in `NavBar.svelte` */
    }

    .scroll-container {
        height: 100%;
        position: relative;
        overflow: scroll;
    }
</style>