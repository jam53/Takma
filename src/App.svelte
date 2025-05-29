<script lang="ts">
    import "./stylesheets/fonts.css";
    import WelcomeScreen from "./components/WelcomeScreen/WelcomeScreen.svelte";
    import {SaveLoadManager} from "./scripts/SaveLoad/SaveLoadManager";
    import NavBar from "./components/NavBar/NavBar.svelte";
    import {isSaveLocationSet, selectedBoardId, selectedCardId} from "./scripts/Stores.svelte.js";
    import BoardScreen from "./components/BoardScreen/BoardScreen.svelte";
    import type {Board} from "./scripts/Board";
    import {getCurrentWebviewWindow} from "@tauri-apps/api/webviewWindow";
    import {currentMonitor, PhysicalPosition, PhysicalSize} from "@tauri-apps/api/window";
    import ChooseSaveLocationScreen from "./components/WelcomeScreen/ChooseSaveLocationScreen.svelte";
    import paintDrops from "./images/PaintDropsScuNET2x_Brightness19Saturation10CleanedEffort6Quality90.webp";
    import {I18n} from "./scripts/I18n/I18n";
    import {listen} from "@tauri-apps/api/event";
    import PopupWindow from "./components/PopupWindow.svelte";
    import {convertFileSrc} from "@tauri-apps/api/core";
    import {join} from "@tauri-apps/api/path";
    import {toast} from "svelte-sonner";
    import {mount} from "svelte";
    import {error, info, warn} from "@tauri-apps/plugin-log";

    const appWindow = getCurrentWebviewWindow();
    isSaveLocationSet.value = !(localStorage.getItem("saveDirectoryPath") === null);

    /**
     * Sets the background image of the body to the image of the selected board
     */
    $effect(async () => {
        if (!isSaveLocationSet.value)
        {
            await info("No save file has been set");
            document.body.style.backgroundImage = `url('${paintDrops.replace(/'/g, "\\'")}')`;
            document.body.style.backgroundColor = `transparent`;
        }
        else if (selectedBoardId.value !== "")
        {
            const board: Board = SaveLoadManager.getData().getBoard(selectedBoardId.value);
            const imgUrl: string = convertFileSrc(await join(SaveLoadManager.getSaveDirectoryPath(), board.backgroundImagePath));

            // Set the background image only if the current boardId hasn't changed during the image loading process.
            //Otherwise it's possible that the user opened a board and quickly went back to the welcome screen. In that case we would set the backgroundImage to "" in the `else` below. And then once the backgroundImage of the previous subscribe event loaded in, we would set the background image. Causing us to see the backgroundImage of the board on the welcomescreen. We avoid this by checking whether or not the board is still selected once the image has actually been loaded.
            if (selectedBoardId.value === selectedBoardId.value)
            {
                document.body.style.backgroundImage = `url('${imgUrl.replace(/'/g, "\\'")}')`;
                document.body.style.backgroundColor = `transparent`;
            }
        }
        else
        {
            document.body.style.backgroundImage = "";
            document.body.style.backgroundColor = `var(--background-color)`;
        }
    });

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

    // listen to the 'deep-link-received' event
    listen("deep-link-received", event => {
        let takmaLink = event.payload;
        info("Received deep link: " + takmaLink);
        const takmaLinkPattern = /takma:\/\/([\w-]+)(?:\/([\w-]+))?/i; //Link to a card `takma://<board id>/<card id>`. Link to a board `takma://<board id>`
        // `takma:\/\/` - This part matches the literal characters "takma://" in the string.
        // `([\w-]+)` - This is the first capturing group (`(...)`) and it matches one or more word characters `(\w)` or hyphens (`-`). The hyphen is included within the character set `[\w-]`. Word characters include uppercase and lowercase letters, digits, and underscores. This capturing group captures the board ID.
        // `(?:\/([\w-]+))?` - This is a non-capturing group (`(?:...)`) followed by a question mark ?, which makes it optional. It matches a forward slash (`\/`) followed by one or more word characters or hyphens. The hyphen is included within the character set `[\w-]`. This capturing group captures the card ID, which is also allowed to contain hyphens. The non-capturing group is used because we're not interested in capturing the forward slash itself.
        // `/i` - This is a flag indicating case-insensitive matching. It allows the pattern to match both uppercase and lowercase characters.

        let match = takmaLink.match(takmaLinkPattern);
        let boardId = match[1];
        let cardId = match[2];

        let boardTitle;
        let cardTitle;

        try
        {
            boardTitle = SaveLoadManager.getData().getBoard(boardId).title;
            cardTitle = SaveLoadManager.getData().getCard(boardId, cardId).title;
        }
        catch (e)
        {
            if (boardTitle === undefined)
            {
                warn("Deep link contained invalid board id");
                mount(PopupWindow, {props: {description: I18n.t("boardIdNotFound", takmaLink.toString()), buttonType: "ok"}, target: document.body, intro: true});
            }
            else if (boardTitle !== undefined && cardId !== undefined && cardTitle === undefined)
            {
                warn("Deep link contained invalid card id");
                mount(PopupWindow, {props: {description: I18n.t("cardIdNotFound", takmaLink.toString()), buttonType: "ok"}, target: document.body, intro: true});
            }
        }
        finally
        {
            if (boardTitle != undefined && cardTitle != undefined)
            {
                selectedBoardId.value = boardId;
                selectedCardId.value = cardId;
            }
            else if (boardTitle != undefined)
            {
                selectedBoardId.value = boardId;
                selectedCardId.value = "";
            }
        }
    });

    // The code below makes it so when we lose focus by alt+tabbing, the last element gets refocused when we alt+tab/switch back to the Takma tab. Otherwise it gets annoying when trying to type something over and alt+tabbing in between, since you would have to first click on the element you were typing on so it would regain focus, before you would be able to continue typing
    let lastFocusedElement = document.activeElement;
    window.addEventListener("focus", () => lastFocusedElement = document.activeElement, true);
    window.addEventListener("blur", () => lastFocusedElement?.focus());

    /**
     * This function will be called when this component enters the DOM, AKA for this component in particular when the app is launched. It then restores the window state Takma was in the last time it was open.
     * This function also does some checks to make sure the window can fit on the screen. In the event that the window wouldn't fit on screen, it gets repositioned and made smaller.
     */
    async function restoreWindowState()
    {
        await info("Restoring application window state")
        let windowState = SaveLoadManager.getData().windowState;

        if (windowState.fullscreen)
        {
            await appWindow.maximize();
        }
        else
        {
            const monitorSize = (await currentMonitor()).size;

            windowState.x = Math.max(0, windowState.x); //If a part of the window is outside of the screen, towards the left or the top, we set the position back to within the bounds of the screen.
            windowState.y = Math.max(0, windowState.y);

            if (windowState.x + windowState.width > monitorSize.width && windowState.width < monitorSize.width)
            {//If the window will be off-screen, but less wide than the screen, reposition it so it fits within the bounds of the screen
                windowState.x = 0;
            }
            else if (windowState.x + windowState.width > monitorSize.width && windowState.width > monitorSize.width)
            {//If the window is wider than the screen, make it smaller and reposition it to fit within the bounds of the screen
                windowState.x = 0;
                windowState.width = Math.round(monitorSize.width * (2 / 3));
            }

            if (windowState.y + windowState.height > monitorSize.height - 100 && windowState.height < monitorSize.height)
            {//-100 is to account for the height of the windows taskbar
                windowState.y = 0;
            }
            else if (windowState.y + windowState.height > monitorSize.height - 100 && windowState.height > monitorSize.height)
            {//-100 is to account for the height of the windows taskbar
                windowState.y = 0;
                windowState.height = Math.round(monitorSize.height * (2 / 3));
            }

            await appWindow.setPosition(new PhysicalPosition(windowState.x, windowState.y));
            await appWindow.unmaximize();
            await appWindow.setSize(new PhysicalSize(windowState.width, windowState.height));
        }

        //Add listeners to get notified about future changes concerning the window state
        appWindow.onMoved(({ payload: position }) => {
            SaveLoadManager.getData().setWindowStatePosition(position.x, position.y)
        });

        appWindow.onResized(async ({payload: size}) =>
        {
            if (!(await appWindow.isMinimized()))
            {//We don't want to save the size of the window when it is minimized. That would cause the Takma window to be very small the next time it is opened.
                SaveLoadManager.getData().setWindowStateSize(size.width, size.height, await appWindow.isMaximized())
            }
        });
    }

    //We may only call the appWindow methods we use in `restoreWindowState()` once this component/the app has loaded, otherwise it crashes
    let navBarElement = $state(null);
    $effect(() => navBarElement !== null && restoreWindowState());

    window.addEventListener("keydown", e => {
        if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "w" && SaveLoadManager.getData().onboardingCompleted)
        {
            appWindow.close();
        }
        else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "w" && !SaveLoadManager.getData().onboardingCompleted)
        {
            toast(I18n.t("shortcutNotAvailableDuringOnboarding"));
        }
    });

    // region log any exceptions that may occur
    window.onerror = (message, source, line) => {
        error(`${message} at ${source} on line: ${line}`);
    };

    window.addEventListener('unhandledrejection', event => {
        error(`Uncaught (in promise): ${event.reason}`);
    });
    //endregion
</script>

<main class="wrapper wrapperNotMaximized" id="main">
{#if !isSaveLocationSet.value}
    <NavBar bind:this={navBarElement} saveLocationSet={false}/>
    <ChooseSaveLocationScreen/>
{:else}
    {#await SaveLoadManager.loadSaveFileFromDisk()}
        <h1>{I18n.t("loadSaveFile")}</h1>
    {:then _}
        <NavBar bind:this={navBarElement} saveLocationSet={true}/>
            {#if selectedBoardId.value === ""}
                <div class="scroll-container">
                <!--If we also want to be able to scroll on the board screen, we should ideally place it in this div. But we don't want that; we only want to be able to scroll in the lists, not the entire board screen itself.-->
                    <WelcomeScreen/>
                </div>
            {:else}
                <BoardScreen/>
            {/if}
    {/await}
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