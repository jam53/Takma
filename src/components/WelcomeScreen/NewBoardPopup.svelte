<script lang="ts">
    import {blur, slide} from "svelte/transition";
    import boardPreview from "../../images/BoardPreview.svg"
    import {onMount} from "svelte";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import type {Board} from "../../scripts/Board";
    import {selectedBoardId} from "../../scripts/stores";
    import {createDir, readBinaryFile, writeBinaryFile} from "@tauri-apps/api/fs";
    import {open} from "@tauri-apps/api/dialog"
    import {getImageUrl, includedImagesInTakma} from "../../scripts/GetImageUrl";

    let showPopup = true;
    let includedImages:string[] = includedImagesInTakma;
    let selectedImg:string = includedImages[0]; //Dit is een url/pad naar de geselecteerde foto. I.e. wat de gebruiker momenteel heeft gekozen als achtergrond foto van het nieuwe bord

    let boardTitle = "";
    let boardTitleInputObject;
    let boardTitleInputWidthOffset = 20;

    let selectedImgObject;

    onMount(() =>
    {
        window.addEventListener("keydown", e => (e.key === "Escape" || (e.key === "w" && e.ctrlKey)) && (showPopup = false));
    });

    //Deze lazyLoaded variabele en lazyLoad variabele worden gebruikt om ervoor te zorgen dat de intro animaite van het NewBoardPopup scherm deftig getoond wordt. Anders freezt de app vanaf dat het wordt aangemaakt, omdat de high rest includedInTakma foto's gerenderd moeten worden. Nu wordt eerst de popup getoond, en pas een seconde later de src van de foto's gezet.
    //Na een seconde zit het dus wel weer frozen, maar op die manier werd de intro animatie + het NewBoardPopup scherm toch direct getoond
    //Eenmaal we een keer het NewBoardPopup scherm hebben geopenend, worden de high res images somehow gecached. We moeten dus niet meer wachten om de src te setten van de images maar kunnen dit direct doen. We passen de lazyLoaded variabele als een prop. Want elke keer dat we op de create board knop drukken wordt er een nieuwe instantie van NewBoardPopup gemaakt. Elke nieuwe instantie zou niet meer weten als lazyLoaded nu true was of niet. Maar omdat dit bijgehouden wordt in de parent en gepassed wordt als een prop kan dit wel
    export let lazyLoaded: boolean;
    function lazyload(node)
    {
        if (lazyLoaded)
        {
            node.setAttribute('src', node.dataset.src);
        }
        else
        {
            setTimeout(() =>
            {
                node.setAttribute('src', node.dataset.src);
                lazyLoaded = true;
            }, 1000);
        }
    }

    async function createNewBoard()
    {
        let board: Board = {
            id: crypto.randomUUID(),
            creationDate: Date.now(),
            backgroundImageUrl: "",
            title: boardTitle
        };

        let savePath;
        if (includedImages.includes(selectedImg))
        {//True als het een foto is die samen met Takma wordt geleverd
            savePath = selectedImg;
        }
        else
        {//Anders is het een foto die de gebruiker heeft gekozen
            const imageData = await readBinaryFile(selectedImg);

            const filename = crypto.randomUUID() + selectedImg.split('/').pop().split("\\").pop(); //Dit extraheert de filename. Zou zowel op window/unix moeten werken omdat we en / en \ doen. We pakken dus alles na de laatste slash met pop. of dus naam.extentie. We voegen er ook nog een random uuid aan toe, om te voorkomen dat we foto's met dezelfde naam overschrijven
            savePath = `./Files/${board.id}`;

            await createDir(savePath, {dir: SaveLoadManager.getSaveDirectory(), recursive: true});

            savePath += "/" + filename;

            await writeBinaryFile(savePath, imageData, {dir: SaveLoadManager.getSaveDirectory()});
        }

        board.backgroundImageUrl = savePath;
        SaveLoadManager.getData().createNewBoard(board);

        $selectedBoardId = board.id;
        showPopup = false;
    }

    async function handleFileSelection()
    {
        const selected = await open({
            multiple: false,
            filters: [{
                name: 'Image',
                extensions: []
            }]
        });
        if (selected !== null && typeof(selected) === "string")
        {
            selectedImg = selected;
            selectedImgObject.setAttribute('src', await getImageUrl(selectedImg));
        }
    }
</script>

{#if showPopup}
    <div transition:blur class="overlay" on:click={() => showPopup = false}>
        <div transition:slide class="popup" on:click={(e) => e.stopPropagation()}>
        <!-- When the user clicks outside the popup, the popup should close. However, when the user clicks on the popup itself, the click event should not be captured by the containing/overlay div. In order to prevent the click event from propagating up to the overlay and triggering the closure of the popup, e.stopPropagation() is called-->
            <div class="titleDiv">
                <h1>%%Create a new board</h1>
                <svg on:click={() => showPopup = false} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5" >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <hr/>
            <div class="selectedImgHolder" >
                <img bind:this={selectedImgObject} use:lazyload data-src={selectedImg} style="object-fit: cover"/>
                <img src={boardPreview} alt="Board preview"/>
            </div>
            <br>
            <h2>%%Background</h2>
            <div class="includedImagesHolder">
                {#if lazyLoaded}
                    <svg on:click={handleFileSelection} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    {#each includedImages as img}
                        <img on:click={async () => {selectedImg = img; selectedImgObject.setAttribute('src', await getImageUrl(selectedImg));}} src={img} style="object-fit: cover" tabindex="0"/>
                        <!--Basically we want to display the border on the last clicked image. We can do this with the :focus selector. However, :focus is only available on elements that receive keyboard input (i.e. form elements). We can get past this limitation by adding `tabindex="0"` to the img-->
                    {/each}
                {:else}
                    <p>%%Loading images...</p>
                {/if}
            </div>
            <br>
            <h2>%%Board name</h2>
            <div class="inputHolderDiv">
                <input bind:this={boardTitleInputObject} bind:value={boardTitle} on:keydown={e => e.key === "Enter" && createNewBoard()}>
            </div>
            <br>
            <br>
            <br>
            <button disabled={!lazyLoaded} on:click={createNewBoard} class="createButton">%%Create</button>
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
    }

    .popup h1 {
        margin: 0;
    }

    .titleDiv {
        display: flex;
        gap: 5em;
        justify-content: space-between;
    }

    .titleDiv svg {
        height: 2em;
        cursor: pointer;
        stroke: var(--unselected-buton);
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

    .includedImagesHolder {
        display: flex;
        flex-flow: row wrap;
        gap: 1em;
    }

    .includedImagesHolder img, .includedImagesHolder svg {
        height: 3em;
        width: 6em;
        border-radius: 0.5em;
        transition: 0.2s;
        cursor: pointer;
    }

    .includedImagesHolder img:hover, .includedImagesHolder img:focus , .includedImagesHolder svg:hover {
        scale: 103%;
        box-shadow: 0 0 0 3px var(--accent);
        stroke: var(--accent);
    }

    .includedImagesHolder svg {
        box-shadow: 0 0 0 2px var(--border);
        stroke: var(--border);
    }

    h2 {
        margin-bottom: 0.5em;
    }

    .inputHolderDiv {
        display: flex;
    }

    input {
        padding: 1em;
        border-radius: 0.5em;
        border: 2px solid var(--border);
        background: none;
        transition: 0.3s;
        flex-grow: 1;
    }

    input:focus, input:hover {
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
</style>