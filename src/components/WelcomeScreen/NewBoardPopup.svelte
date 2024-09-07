<script lang="ts">
    import {blur, slide} from "svelte/transition";
    import boardPreview from "../../images/BoardPreview.svg"
    import {onMount} from "svelte";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {selectedBoardId} from "../../scripts/stores";
    import {exists, readDir} from "@tauri-apps/api/fs";
    import {open} from "@tauri-apps/api/dialog"
    import {imageExtensions, removeFileFromTakmaDataFolder, saveFilePathToDisk} from "../../scripts/TakmaDataFolderIO";
    import {resolveResource} from "@tauri-apps/api/path";
    import {shuffle} from "../../scripts/KnuthShuffle";
    import {I18n} from "../../scripts/I18n/I18n";
    import {scaleDownImage} from "../../scripts/ScaleDownImage";
    import {convertFileSrc} from "@tauri-apps/api/tauri";

    let showPopup = true;
    let selectedImg:string; //Dit is een url/pad naar de geselecteerde foto. I.e. wat de gebruiker momenteel heeft gekozen als achtergrond foto van het nieuwe bord. By default is dit de eerste foto van de lijst van foto's die default bij Takma zit

    let boardTitle = "";
    let boardTitleInputObject;

    let selectedImgObject;

    onMount(() =>
    {
        window.addEventListener("keydown", listenToKeyDown);
    });

    function listenToKeyDown(e)
    {
        if (e.key === "Escape" || (e.key === "w" && e.ctrlKey))
        {
            closePopup();
        }
        else if (e.key === "Enter")
        {
            createNewBoard();
            e.stopPropagation();
            e.preventDefault();
        }
    }

    function closePopup()
    {
        showPopup = false;
        removeKeyDownListeners();
    }

    function removeKeyDownListeners()
    {
        window.removeEventListener("keydown", listenToKeyDown);
    }

    //Deze lazyLoaded variabele en lazyLoad variabele worden gebruikt om ervoor te zorgen dat de intro animaite van het NewBoardPopup scherm deftig getoond wordt. Anders freezt de app vanaf dat het wordt aangemaakt, omdat de high rest includedInTakma foto's gerenderd moeten worden. Nu wordt eerst de popup getoond, en pas een seconde later de src van de foto's gezet.
    //Na een seconde zit het dus wel weer frozen, maar op die manier werd de intro animatie + het NewBoardPopup scherm toch direct getoond
    //Eenmaal we een keer het NewBoardPopup scherm hebben geopenend, worden de high res images somehow gecached. We moeten dus niet meer wachten om de src te setten van de images maar kunnen dit direct doen. We passen de lazyLoaded variabele als een prop. Want elke keer dat we op de create board knop drukken wordt er een nieuwe instantie van NewBoardPopup gemaakt. Elke nieuwe instantie zou niet meer weten als lazyLoaded nu true was of niet. Maar omdat dit bijgehouden wordt in de parent en gepassed wordt als een prop kan dit wel
    export let lazyLoaded: boolean;
    function lazyload()
    {
        if (!lazyLoaded)
        {
            setTimeout(() =>
            {
                lazyLoaded = true;
            }, 1000);
        }
    }

    async function loadImagesIncludedInTakma()
    {
        let includedImagesPaths = (await readDir((await resolveResource("resources/backgrounds/")))).map(fileEntry => fileEntry.path);
        shuffle(includedImagesPaths);

        selectedImg = includedImagesPaths[0];

        return includedImagesPaths;
    }

    async function loadCustomBoardBackgrounds()
    {
        if (await exists(SaveLoadManager.getBoardFilesPath() + "CustomBoardBackgrounds/", {dir: SaveLoadManager.getSaveDirectory()}))
        {
            let customImagesPaths = (await readDir(await SaveLoadManager.getAbsoluteSaveDirectory() + SaveLoadManager.getBoardFilesPath() + "CustomBoardBackgrounds/")).map(fileEntry => fileEntry.path);
            shuffle(customImagesPaths);

            return customImagesPaths;
        }
        else
        {
            return [];
        }
    }

    async function createNewBoard()
    {
        let idCreatedBoard = await SaveLoadManager.getData().createNewBoard(boardTitle, selectedImg);

        if (saveBoardBackgroundForFuture)
        {
            await saveFilePathToDisk(selectedImg, "CustomBoardBackgrounds"); //The second parameter of this function is supposed to be a board id, which "CustomBoardBackgrounds" clearly is not. However, the way `saveFilePathToDisk()` uses that boardId is to decide in which subfolder to save/write the file to. So in this case we want that to be a folder called "CustomBoardBackgrounds" hence why we pass that as the `boardId`
        }

        $selectedBoardId = idCreatedBoard;
        closePopup();
    }

    async function handleFileSelection()
    {
        const selected = await open({
            multiple: false,
            filters: [{
                name: I18n.t("image"),
                extensions: imageExtensions
            }]
        });
        if (selected !== null && typeof(selected) === "string")
        {
            selectedImg = selected;
            selectedImgObject.setAttribute('src', await scaleDownImage(convertFileSrc(selectedImg), 720));
            document.activeElement.blur(); //When the user clicks on one of the available pictures before selecting one from disk, that picture element would still appear to be "selected" AKA focused. That's why we remove the focus of the active element when picking a new image
        }
    }

    let saveBoardBackgroundForFuture = false;
</script>

{#if showPopup}
    <div transition:blur|global class="overlay" on:click={closePopup}>
        <div transition:slide|global class="popup" on:click={(e) => e.stopPropagation()}>
        <!-- When the user clicks outside the popup, the popup should close. However, when the user clicks on the popup itself, the click event should not be captured by the containing/overlay div. In order to prevent the click event from propagating up to the overlay and triggering the closure of the popup, e.stopPropagation() is called-->
            <div class="titleDiv">
                <h1>{I18n.t("createNewBoard")}</h1>
                <svg on:click={closePopup} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5" >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <hr/>
            {#await loadImagesIncludedInTakma()}
                <span class="loader"></span>
            {:then includedImagesInTakma}
                {#await loadCustomBoardBackgrounds()}
                    <span class="loader"></span>
                {:then customBoardBackgrounds}
                    <div class="selectedImgHolder" >
                        {#await scaleDownImage(convertFileSrc(includedImagesInTakma[0]), 720)}
                        {:then defaultImage}
                        <img bind:this={selectedImgObject} use:lazyload src={defaultImage} style="object-fit: cover"/>
                        <img src={boardPreview} alt="Board preview"/>
                        {/await}
                    </div>
                    <h2 style="margin-bottom: 0">{I18n.t("background")}</h2>
                    {#if !includedImagesInTakma.includes(selectedImg) && !customBoardBackgrounds.includes(selectedImg)}
                        <div class="saveImageForFutureContainer"
                             on:click={() => saveBoardBackgroundForFuture = !saveBoardBackgroundForFuture}
                        >
                            <input
                                type="checkbox"
                                bind:checked={saveBoardBackgroundForFuture}
                            />
                            <span
                            >
                                {I18n.t("saveBackgroundImage")}
                            </span>
                        </div>
                    {:else}
                        {void (() => saveBoardBackgroundForFuture = false)() ?? ""}
                        <!-- The void operator evaluates the given expression and then returns undefined. Then with the nullish operator we return an empty string when it's undefined, which will always be the case. This way we can execute some code in our html, without displaying anything in the UI-->
                    {/if}
                    <div class="imagesHolder">
                        {#if lazyLoaded}
                            <svg on:click={handleFileSelection} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            {#if customBoardBackgrounds.length > 0}
                            {#each customBoardBackgrounds as imgPath}
                                {#await scaleDownImage(convertFileSrc(imgPath), 192)}
                                {:then imgUrl}
                                    <div class="customBackgroundImageAndDeleteButtonContainer">
                                        <svg class="deleteCustomBackgroundButton" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                             on:click={async e => {
                                                 await removeFileFromTakmaDataFolder(imgPath);

                                                 if (!includedImagesInTakma.includes(selectedImg))
                                                 {
                                                     selectedImg = includedImagesInTakma[0];
                                                     selectedImgObject.setAttribute('src', await scaleDownImage(convertFileSrc(selectedImg), 720));
                                                 }

                                                 e.target.tagName === "svg" ? e.target.parentNode.remove() : e.target.parentNode.parentNode.remove();
                                                 //If the parent node isn't the div containing this delete button and the image, then it means the user clicked on the path, so we need to go parent.parent to get to the div
                                                 //The error below this line saying "unexpected token" for the second `}` is shown because we wrote a comment here. If we would remove the comment, the error message would go away as well. But even though it gives an error message, at runtime everything works fine
                                             }}
                                        >
                                            <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clip-rule="evenodd" />
                                        </svg>
                                        <img on:click={async () => {selectedImg = imgPath; selectedImgObject.setAttribute('src', await scaleDownImage(convertFileSrc(imgPath), 720));}} src={imgUrl} style="object-fit: cover" tabindex="0" />
                                        <!--Basically we want to display the border on the last clicked image. We can do this with the :focus selector. However, :focus is only available on elements that receive keyboard input (i.e. form elements). We can get past this limitation by adding `tabindex="0"` to the img-->
                                    </div>
                                {/await}
                            {/each}
                                <hr class="verticalImagesSeparator">
                            {/if}
                            {#each includedImagesInTakma as imgPath}
                                {#await scaleDownImage(convertFileSrc(imgPath), 192)}
                                {:then imgUrl}
                                <img on:click={async () => {selectedImg = imgPath; selectedImgObject.setAttribute('src', await scaleDownImage(convertFileSrc(imgPath), 720));}} src={imgUrl} style="object-fit: cover" tabindex="0" />
                                <!--Basically we want to display the border on the last clicked image. We can do this with the :focus selector. However, :focus is only available on elements that receive keyboard input (i.e. form elements). We can get past this limitation by adding `tabindex="0"` to the img-->
                                {/await}
                            {/each}
                        {:else}
                            <span class="loader"></span>
                        {/if}
                    </div>
                {/await}
            {/await}
            <h2>{I18n.t("boardName")}</h2>
            <div class="inputHolderDiv">
                <input class="titleInput" bind:this={boardTitleInputObject} bind:value={boardTitle}>
            </div>
            <br>
            <button disabled={!lazyLoaded} on:click={createNewBoard} class="createButton">{I18n.t("createBoard")}</button>
        </div>
    </div>
{/if}

<style>
    .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        border-radius: 10px;
    }

    .popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: var(--background-color);
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.3);

        max-height: 80vh;
        overflow: auto;
    }

    .popup h1 {
        margin: 0;
    }

    .titleDiv {
        display: flex;
        gap: 5em;
        justify-content: space-between;
        align-items: center;
    }

    .titleDiv svg {
        height: 2em;
        cursor: pointer;
        stroke: var(--unselected-button);
        transition: 0.2s;
    }

    .titleDiv svg:hover {
        stroke: var(--selected-button);
    }

    hr {
        border: 1px solid var(--border);
        margin-bottom: 1em;
    }

    .selectedImgHolder {
        display: flex;
        height: 12em;
        justify-content: center;
        align-items: center;
    }

    .selectedImgHolder img {
        position: absolute;
        width: 22.5em;
        height: inherit;
        border-radius: 1em;
    }

    .imagesHolder {
        display: flex;
        flex-flow: column wrap;
        gap: 1em;

        padding: 0.5em;
        max-height: calc(2 * (3em + 0.5em)); /* Amount of pictures above each other substracted by one * (height of one picture + border radius of pictures) */
        overflow: auto;
        white-space: nowrap;
    }

    .imagesHolder img, .imagesHolder svg {
        height: 3em;
        width: 6em;
        border-radius: 0.5em;
        transition: 0.2s;
        cursor: pointer;
    }

    .imagesHolder img:hover, .imagesHolder img:focus , .imagesHolder svg:hover {
        scale: 103%;
        box-shadow: 0 0 0 3px var(--accent);
        stroke: var(--accent);
    }

    .imagesHolder svg {
        box-shadow: 0 0 0 2px var(--border);
        stroke: var(--border);
    }

    h2 {
        margin-bottom: 0.5em;
    }

    .inputHolderDiv {
        display: flex;
    }

    .titleInput {
        padding: 1em;
        border-radius: 0.5em;
        border: 2px solid var(--border);
        background: none;
        transition: 0.3s;
        flex-grow: 1;
    }

    .titleInput:focus, .titleInput:hover {
        border: 2px solid var(--accent);
        box-shadow: 0 0 0 0;
    }

    .createButton {
        color: white;
        width: 100%;
        padding: 1em;
        background: var(--accent);
        border: none;
        border-radius: 0.5em;
        font-size: large;
        cursor: pointer;
        transition: 0.3s;
    }

    .createButton:hover {
        background: var(--accent-button-hover);
    }

    [type=checkbox] {
        width: 1.5em;
        height: 1.5em;
        color: var(--accent);
        vertical-align: middle;
        -webkit-appearance: none;
        background: none;
        outline: 0;
        flex-grow: 0;
        border-radius: 0.25em;
        transition: background 300ms;
        cursor: pointer;
    }

    [type=checkbox]::before {
        content: "";
        color: transparent;
        display: block;
        width: inherit;
        height: inherit;
        border-radius: inherit;
        border: 0;
        background-color: transparent;
        background-size: contain;
        box-shadow: inset 0 0 0 2px var(--border);
        transition: 0.3s;
    }

    [type=checkbox]:hover::before {
        box-shadow: inset 0 0 0 2px var(--unselected-button);
    }

    [type=checkbox]:checked {
        background-color: currentcolor;
    }

    [type=checkbox]:checked::before {
        box-shadow: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='2 2 20 20'%3E %3Cpath d='M15.88 8.29L10 14.17l-1.88-1.88a.996.996 0 1 0-1.41 1.41l2.59 2.59c.39.39 1.02.39 1.41 0L17.3 9.7a.996.996 0 0 0 0-1.41c-.39-.39-1.03-.39-1.42 0z' fill='%23fff'/%3E %3C/svg%3E");
    }

    [type=checkbox]:disabled {
        background-color: #CCD3D8;
        opacity: 0.84;
        cursor: not-allowed;
    }

    .saveImageForFutureContainer {
        display: flex;
        align-items: center;
        gap: 0.25em;
        align-content: space-around;
        cursor: pointer;
        padding: 0.25em 0;
    }

    .saveImageForFutureContainer span {
        width: 100%;
        transition: 0.2s;
        border-radius: 0.25em;
        padding: 0.25em;
        word-break: break-word;
        user-select: none;
    }

    .verticalImagesSeparator {
        background: var(--border);
        border-radius: 1em;
        display: inline-block;
        height: 3em;
        width: 0.1em;
        margin: 0;
    }

    .deleteCustomBackgroundButton {
        color: transparent !important;
        position: relative;
        stroke: none !important;
        width: 1.25em !important;
        margin-left: -1.5em; /* About equal to the height of the element, we use this margin to offset the width of the element. Because we want to position this element relative to another above it, but we don't want this element to take up any space. */
        box-shadow: none !important;
        z-index: 1;
        left: 6em;
        top: -0.5em;
        -webkit-filter: drop-shadow(0 0 3px rgba(0, 0, 0, .25));
    }

    .customBackgroundImageAndDeleteButtonContainer:hover .deleteCustomBackgroundButton {
        color: white !important;
    }

    .customBackgroundImageAndDeleteButtonContainer:hover .deleteCustomBackgroundButton:hover {
        color: var(--danger) !important;
        -webkit-filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.5));
    }
</style>