<script lang="ts">
    import {blur, slide} from "svelte/transition";
    import {onMount} from "svelte";
    import {I18n} from "../scripts/I18n/I18n";

    /**
     * This is a custom popup window that can be instantiated using
     * ```
     * import PopupWindow from "./PopupWindow.svelte";
     *
     * const popup = new PopupWindow({props: {title: "Popup title", description: "Popup description", buttonType: "yesno"}, target: document.body, intro: true});
     * new PopupWindow({props: {description: "Popup description", buttonType: "ok"}, target: document.body, intro: true});
     * new PopupWindow({props: {description: "Popup description", inputValue: "Lorem ipsum", buttonType: "input"}, target: document.body, intro: true});
     *
     *
     * await popup.getAnswer();
     * ```
     */

    export let title: string | null;
    export let description: string;
    export let inputValue: string | null;
    export let buttonType: "yesno" | "ok" | "input";

    let showPopup = true;
    let answer: boolean | null = null;

    onMount(() =>
    {
        title = title ?? "Takma";
    });

    function handleKeyDown(e)
    {
        if (e.key === "Escape" || (e.key === "w" && e.ctrlKey))
        {
            answer = false;
            closePopup();
        }
        else if (e.key === "Enter")
        {
            answer = true;
            closePopup();
            e.stopPropagation();
            e.preventDefault();
        }
    }

    function closePopup()
    {
        showPopup = false;
    }

    /**
     * Returns the user's answer to the popup
     */
    export async function getAnswer(): Promise<boolean>
    {
        while (answer === null)
        {
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for 100ms
        }

        return answer;
    }

    /**
     * Returns the user's answer to the popup's input field
     */
    export async function getInputFieldAnswer(): Promise<string>
    {
        while (answer === null)
        {
            await new Promise(resolve => setTimeout(resolve, 100)); // Wait for 100ms
        }

        return inputValue ?? "";
    }

    let overlayElement;
    $: overlayElement?.focus(); //If we don't focus on the overlayElement, i.e. the container of this popup, then we won't be able to detect the on:keydown event
</script>

{#if showPopup}
    <div transition:blur|global
         class="overlay"
         on:click={() => {answer = false; closePopup()}}
         bind:this={overlayElement}
         on:keydown|stopPropagation={handleKeyDown}
         tabindex="1"
    >
        <div transition:slide|global class="popup" on:click={(e) => e.stopPropagation()}>
            <!-- When the user clicks outside the popup, the popup should close. However, when the user clicks on the popup itself, the click event should not be captured by the containing/overlay div. In order to prevent the click event from propagating up to the overlay and triggering the closure of the popup, e.stopPropagation() is called-->
            <div class="titleDiv">
                <h1>{title}</h1>
                <svg on:click={closePopup} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5" >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <hr/>
            <p>
                {@html description}
            </p>
            {#if buttonType === "input"}
                <div class="inputHolderDiv">
                    <input class="titleInput" bind:value={inputValue}>
                </div>
            {/if}
            <div class="buttonsHolder">
                {#if buttonType === "yesno"}
                    <button class="cancelButton"
                            on:click={() => {
                                answer = false;
                                closePopup();
                            }}
                    >
                        {I18n.t("no")}
                    </button>
                    <button class="okButton"
                            on:click={() => {
                            answer = true;
                            closePopup();
                        }}
                    >
                        {I18n.t("yes")}
                    </button>
                {:else if buttonType === "ok"}
                    <button class="okButton"
                            on:click={() => {
                            answer = true;
                            closePopup();
                        }}
                    >
                        {I18n.t("ok")}
                    </button>
                {:else if buttonType === "input"}
                    <button class="cancelButton"
                            on:click={() => {
                                answer = false;
                                closePopup();
                            }}
                    >
                        {I18n.t("cancel")}
                    </button>
                    <button class="okButton"
                            on:click={() => {
                            answer = true;
                            closePopup();
                        }}
                    >
                        {I18n.t("confirm")}
                    </button>
                {/if}
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

    h2 {
        margin-bottom: 0.25em;
    }

    .buttonsHolder {
        display: flex;
        gap: 2em;
    }

    .buttonsHolder button {
        border: none;
        padding: 0.5em;
        width: 100%;
        border-radius: 4px;
        cursor: pointer;
        font-size: large;
        transition: 0.3s;
    }

    .cancelButton {
        background: var(--border);
    }

    .cancelButton:hover {
        background: var(--unselected-button);
    }

    .okButton {
        color: white;
        background: var(--accent);
    }

    .okButton:hover {
        background: var(--accent-button-hover);
    }

    .inputHolderDiv {
        display: flex;
        margin-bottom: 1em;
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
</style>