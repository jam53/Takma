<script lang="ts">
    import "./stylesheets/fonts.css";
    import WelcomeScreen from "./components/WelcomeScreen/WelcomeScreen.svelte";
    import {SaveLoadManager} from "./scripts/SaveLoad/SaveLoadManager";
    import NavBar from "./components/NavBar/NavBar.svelte";
    import {savefileSet, selectedBoardId, selectedCardId} from "./scripts/stores";
    import BoardScreen from "./components/BoardScreen/BoardScreen.svelte";
    import type {Board} from "./scripts/Board";
    import ChooseSaveLocationScreen from "./components/WelcomeScreen/ChooseSaveLocationScreen.svelte";
    import paintDrops from "./images/PaintDropsScuNET2x_Brightness19Saturation10CleanedEffort6Quality90.webp";
    import {I18n} from "./scripts/I18n/I18n";
    import PopupWindow from "./components/PopupWindow.svelte";
    import {getThumbnail} from "./scripts/ThumbnailGenerator";

    /**
     * Sets the background image of the body to the image of the selected board
     */
    selectedBoardId.subscribe(async boardId => {
        if (!$savefileSet)
        {
            await info("No save file has been set");
            document.body.style.backgroundImage = `url('${paintDrops.replace(/'/g, "\\'")}')`;
            document.body.style.backgroundColor = `transparent`;
        }
        else
        {
            document.body.style.backgroundImage = "";
            document.body.style.backgroundColor = `var(--background-color)`;
        }
    });


    // The code below makes it so when we lose focus by alt+tabbing, the last element gets refocused when we alt+tab/switch back to the Takma tab. Otherwise it gets annoying when trying to type something over and alt+tabbing in between, since you would have to first click on the element you were typing on so it would regain focus, before you would be able to continue typing
    let lastFocusedElement = document.activeElement;
    window.addEventListener("focus", () => lastFocusedElement = document.activeElement, true);
    window.addEventListener("blur", () => lastFocusedElement?.focus());

    window.clearLastFocusedElement = () => {
        lastFocusedElement = null;
    };
</script>

<main class="wrapper wrapperNotMaximized" id="main">
{#if !$savefileSet}
    <NavBar saveLocationSet={false}/>
    <ChooseSaveLocationScreen/>
{:else}
    <NavBar saveLocationSet={true}/>
    {#if $selectedBoardId === ""}
        <div class="scroll-container">
        <!--If we also want to be able to scroll on the board screen, we should ideally place it in this div. But we don't want that; we only want to be able to scroll in the lists, not the entire board screen itself.-->
            <WelcomeScreen/>
        </div>
    {:else}
        <BoardScreen/>
    {/if}
{/if}
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