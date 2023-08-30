<script lang="ts">
    import "./stylesheets/styles.css"
    import "./stylesheets/fonts.css"
    import WelcomeScreen from "./components/WelcomeScreen/WelcomeScreen.svelte";
    import {SaveLoadManager} from "./scripts/SaveLoad/SaveLoadManager";
    import NavBar from "./components/NavBar/NavBar.svelte";
    import {selectedBoardId, selectedCardId} from "./scripts/stores";
    import BoardScreen from "./components/BoardScreen/BoardScreen.svelte";
    import type {Board} from "./scripts/Board";
    import {getImageUrl} from "./scripts/GetImageUrl";
    import {appWindow} from "@tauri-apps/api/window";
    import ChooseSaveLocationScreen from "./components/WelcomeScreen/ChooseSaveLocationScreen.svelte";
    import paintDrops from "./images/PaintDropsScuNET2x_Brightness19Saturation10CleanedEffort6Quality90.webp";
    import {I18n} from "./scripts/I18n/I18n";
    import {listen} from "@tauri-apps/api/event";
    import PopupWindow from "./components/PopupWindow.svelte";

    /**
     * Sets the background image of the body to the image of the selected board
     */
    selectedBoardId.subscribe(async boardId => {
        if (localStorage.getItem("saveLocation") === null)
        {
            document.body.style.backgroundImage = `url('${paintDrops}')`;
            document.body.style.backgroundColor = `transparent`;
        }
        else if (boardId != "")
        {
            const board: Board = SaveLoadManager.getData().getBoard($selectedBoardId);
            const imgUrl: string = await getImageUrl(board.backgroundImagePath, SaveLoadManager.getSaveDirectory());

            // Set the background image only if the current boardId hasn't changed during the image loading process.
            //Otherwise it's possible that the user opened a board and quickly went back to the welcome screen. In that case we would set the backgroundImage to "" in the `else` below. And then once the backgroundImage of the previous subscribe event loaded in, we would set the background image. Causing us to see the backgroundImage of the board on the welcomescreen. We avoid this by checking whether or not the board is still selected once the image has actually been loaded.
            if (boardId === $selectedBoardId)
            {
                document.body.style.backgroundImage = `url('${imgUrl}')`;
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
    listen('deep-link-received', (event) => {
        let takmaLink = event.payload; // event.payload is the request object AKA the takma link
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
                new PopupWindow({props: {description: I18n.t("boardIdNotFound", takmaLink.toString()), buttonType: "ok"}, target: document.body, intro: true});
            }
            else if (boardTitle !== undefined && cardId !== undefined && cardTitle === undefined)
            {
                new PopupWindow({props: {description: I18n.t("cardIdNotFound", takmaLink.toString()), buttonType: "ok"}, target: document.body, intro: true});
            }
        }
        finally
        {
            if (boardTitle != undefined && cardTitle != undefined)
            {
                $selectedBoardId = boardId;
                $selectedCardId = cardId;
            }
            else if (boardTitle != undefined)
            {
                $selectedBoardId = boardId;
                $selectedCardId = "";
            }
        }
    });
</script>

<main class="wrapper wrapperNotMaximized" id="main">
{#await SaveLoadManager.loadSaveFileFromDisk()}
    <h1>{I18n.t("loadSaveFile")}</h1>
{:then _}
    <NavBar/>
        {#if localStorage.getItem("saveLocation") === null}
          <ChooseSaveLocationScreen/>
        {:else if $selectedBoardId === ""}
            <div class="scroll-container">
            <!--Indien we op het boardscreen ook willen kunnen scrollen, dan zetten we die best ook in deze div. Maar dat willen we niet, we willen alleen kunnen scrollen in de lijsten. Niet het volledige boardscreen zelf-->
                <WelcomeScreen/>
            </div>
        {:else}
            <BoardScreen/>
        {/if}
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