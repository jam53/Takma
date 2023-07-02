<script lang="ts">
    import {blur, slide} from "svelte/transition";
    import {afterUpdate, onMount} from "svelte";
    import {selectedBoardId, selectedCardId} from "../../scripts/stores";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import type {Card} from "../../scripts/Board";

    export let refreshListsFunction;

    let typing: boolean; //If we are currently typing, we make sure we don't focus in `afterUpdate` on the containing div. Otherwise we would lose focus of whatever element we are typing in, after every keystroke. As for why we focus one the containing div (overlayElement), this is because otherwise we wouldn't be able to detect keyDown events; these are used to check for Esc / Ctrl+W events to close the CardDetails window
    let cardToSave: Card; //Rather than saving every single time for every change, we will keep track of the current card in this variable, and once we close the CardDetails window, only then will we save the card to disk.

    onMount(() =>
    {
        selectedCardId.subscribe(value =>
        {
            if (value != "")
            {
                showPopup = true;
                cardToSave = SaveLoadManager.getData().getCard($selectedBoardId, value);
            }
            else
            {
                showPopup = false;
            }
        });

    });

    afterUpdate(() =>
    {
        if (!typing && showPopup)
        {
            overlayElement && overlayElement.focus(); //If we don't focus on the containing div, which is this `overlayElement`. Then we wont be able to listen to the on:keydown events
        }
    });


    function handleKeyDown(e)
    {
        if(e.key === "Escape" || (e.key === "w" && e.ctrlKey))
        {
            closeCard();
        }
    }

    function closeCard()
    {
        SaveLoadManager.getData().updateCard(cardToSave, $selectedBoardId, $selectedCardId);
        cardToSave = null;
        refreshListsFunction();
        $selectedCardId = "";
    }

    let showPopup = false;
    let overlayElement;

</script>

{#if showPopup}
    <div transition:blur|global bind:this={overlayElement} class="overlay" on:click={closeCard} tabindex="1" on:keydown|stopPropagation={handleKeyDown}>
        <div transition:slide|global class="popup" on:click={(e) => e.stopPropagation()}>
            <!-- When the user clicks outside the popup, the popup should close. However, when the user clicks on the popup itself, the click event should not be captured by the containing/overlay div. In order to prevent the click event from propagating up to the overlay and triggering the closure of the popup, e.stopPropagation() is called-->
            <div class="titleDiv">
                <span role="textbox" contenteditable
                       on:focus={() => typing = true}
                       on:focusout={(e) => {typing = false; cardToSave.title = e.target.textContent}}
                       on:keydown|stopPropagation={e => (e.keyCode === 13) && e.preventDefault()}
                       >
<!--This keycode 13 check prevents the user from typing newlines. If they would copy in new lines, they will be visible while editing the span. But once we close the editing of the span and reopen it, the newline will be gone-->
                    {cardToSave.title}
                </span>
                <svg on:click={closeCard} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5" >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <hr/>
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

    .titleDiv {
        display: flex;
        gap: 1em;
        justify-content: space-between;
        align-items: center;
    }

    .titleDiv svg {
        height: 2em;
        cursor: pointer;
        stroke: var(--unselected-buton);
        transition: 0.2s;
    }

    .titleDiv span {
        padding: 0.5em 0.25em;
        border-radius: 0.5em;
        border: 2px solid transparent;
        background: none;
        transition: 0.3s;
        flex-grow: 1;
        width: 100%;
        font-size: x-large;
        font-weight: bold;
        resize: none;
        cursor: text;
        display: block;
        overflow: hidden;
        min-height: 1em;
        min-width: min(28em, 70vw);
        max-width: min(28em, 70vw);
    }

    .titleDiv span[contenteditable]:empty::before {
        content: "%%Enter a title for this card...";
        color: gray;
    }

    .titleDiv span:focus, .titleDiv span:hover {
        border: 2px solid var(--accent);
        box-shadow: 0 0 0 0;
    }

    .titleDiv svg:hover {
        stroke: var(--selected-button);
    }

    hr {
        border: 1px solid var(--border);
        margin-bottom: 1em;
    }
</style>