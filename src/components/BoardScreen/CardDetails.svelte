<script lang="ts">
    import {blur, slide} from "svelte/transition";
    import {afterUpdate, onMount} from "svelte";
    import {selectedBoardId, selectedCardId} from "../../scripts/stores";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import type {Card} from "../../scripts/Board";
    import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification';

    export let refreshListsFunction;

    let typing: boolean; //If we are currently typing, we make sure we don't focus in `afterUpdate` on the containing div. Otherwise we would lose focus of whatever element we are typing in, after every keystroke. As for why we focus one the containing div (overlayElement), this is because otherwise we wouldn't be able to detect keyDown events; these are used to check for Esc / Ctrl+W events to close the CardDetails window
    let cardToSave: Card; //Rather than saving every single time for every change, we will keep track of the current card in this variable, and once we close the CardDetails window, only then will we save the card to disk.

    onMount(() =>
    {
        selectedCardId.subscribe(value =>
        {
            if (value != "" && $selectedCardId != "")
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

    async function showNotification(message: string)
    {
        let permissionGranted = await isPermissionGranted();
        if (!permissionGranted)
        {
            const permission = await requestPermission();
            permissionGranted = permission === 'granted';
        }
        if (permissionGranted)
        {
            sendNotification({ title: 'Takma', body: message });
        }
    }

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
            <div class="bottomPart">
                <div class="cardMainAreaHolder">
                    description
                </div>
                <div class="cardActionsHolder">
                    <span>
                        %%Add to card
                    </span>
                    <button>
                        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path><path d="M7 7h.01"></path></svg>
                        %%Labels
                    </button>
                    <button>
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M168.531 215.469l-29.864 29.864 96 96L448 128l-29.864-29.864-183.469 182.395-66.136-65.062zm236.802 189.864H106.667V106.667H320V64H106.667C83.198 64 64 83.198 64 106.667v298.666C64 428.802 83.198 448 106.667 448h298.666C428.802 448 448 428.802 448 405.333V234.667h-42.667v170.666z"></path></svg>
                        %%Checklist
                    </button>
                    <button>
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke-width="2" d="M22,12 C22,12 19.0000009,15.0000004 13.0000004,21.0000004 C6.99999996,27.0000004 -2.00000007,18.0000004 3.99999994,12.0000004 C9.99999996,6.00000037 9,7.00000011 13,3.00000008 C17,-0.999999955 23,4.99999994 19,9.00000005 C15,13.0000002 12.0000004,16.0000007 9.99999995,18.0000004 C7.99999952,20 5,17 6.99999995,15.0000004 C8.99999991,13.0000007 16,6 16,6"></path></svg>
                        %%Attachment
                    </button>
                    <button>
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z"></path><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H3V5h18v11z"></path></svg>
                        %%Cover
                    </button>
                    <br>
                    <span>
                        %%Actions
                    </span>
                    <button on:click={() => showNotification("%%Copied link to this card to clipboard, paste it in any other card's description")}>
                        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        %%Link
                    </button>
                    <hr style="margin: 0">
                    <button id="deleteButton">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clip-rule="evenodd" />
                        </svg>
                        %%Delete
                    </button>
                </div>
            </div>
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
        margin-bottom: 1.5em;
    }

    .bottomPart {
        display: flex;
    }

    .cardMainAreaHolder {
        border: 1px solid red;
    }

    .cardActionsHolder {
        width: 11em;
        display: flex;
        flex-direction: column;
        gap: 0.5em;
    }

    .cardActionsHolder button {
        width: 100%;
        height: 2.5em;
        border: none;
        font-size: medium;
        display: flex;
        align-items: center;
        gap: 0.75em;
        border-radius: 4px;
        cursor: pointer;
        background-color: var(--border);
        transition: 0.3s;
    }

    .cardActionsHolder button:hover {
        background-color: var(--unselected-buton);
    }

    #deleteButton:hover {
        background-color: #c43420;
    }

    .cardActionsHolder button svg {
        height: 1.25em;
    }
</style>