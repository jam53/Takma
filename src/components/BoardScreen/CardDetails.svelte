<script lang="ts">
    import {blur, slide} from "svelte/transition";
    import {afterUpdate, onMount} from "svelte";
    import {selectedCardId} from "../../scripts/stores";

    export let refreshListsFunction;

    onMount(() =>
    {
        selectedCardId.subscribe(value =>
        {
            showPopup = value != "";
        });

    });

    afterUpdate(() =>
    {
        overlayElement && overlayElement.focus(); //If we don't focus on the containing div, which is this `overlayElement`. Then we wont be able to listen to the on:keydown events
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
        $selectedCardId = ""
    }

    let showPopup = false;
    let overlayElement;

</script>

{#if showPopup}
    <div transition:blur|global bind:this={overlayElement} class="overlay" on:click={closeCard} tabindex="1" on:keydown|stopPropagation={handleKeyDown}>
        <div transition:slide|global class="popup" on:click={(e) => e.stopPropagation()}>
            <!-- When the user clicks outside the popup, the popup should close. However, when the user clicks on the popup itself, the click event should not be captured by the containing/overlay div. In order to prevent the click event from propagating up to the overlay and triggering the closure of the popup, e.stopPropagation() is called-->
            <div class="titleDiv">
                <input value="" placeholder="%Enter a title for this card..." />
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

    .titleDiv input {
        padding: 0.5em 0.5em 0.5em 0;
        border-radius: 0.5em;
        border: 2px solid transparent;
        background: none;
        transition: 0.3s;
        flex-grow: 1;
        width: 100%;
        font-size: x-large;
        font-weight: bold;
    }

    .titleDiv input:focus, .titleDiv input:hover {
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