<script lang="ts">
    import {blur, slide} from "svelte/transition";
    import {onMount} from "svelte";
    import {I18n} from "../scripts/I18n/I18n";

    /**
     * This is a custom popup window that can be instantiated using
     * ```
     * import PopupWindow from "./PopupWindow.svelte";
     *
     * const popup = mount(PopupWindow, {props: {title: "Popup title", description: "Popup description", buttonType: "yesno"}, target: document.body, intro: true});
     *
     * await popup.getAnswer();
     * ```
     */

    interface Props {
        title?: string;
        description: string;
        inputValue?: string;
        showConfirmation?: boolean
        buttonType: "yesno" | "ok" | "input";
    }

    let {
        title,
        description,
        inputValue,
        showConfirmation,
        buttonType,
    }: Props = $props();

    let showPopup = $state(true);
    let answer: boolean | null = $state(null);
    let showConfirmationAgain = $state(true);

    onMount(() =>
    {
        title = title ?? "Takma";
    });

    function handleKeyDown(e: KeyboardEvent)
    {
        e.stopPropagation();

        if (e.key === "Escape" || (e.key.toLowerCase() === "w" && e.ctrlKey))
        {
            answer = false;
            closePopup();
        }
        else if (e.key === "Enter")
        {
            answer = true;
            closePopup();
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
    export function getInputFieldAnswer(): string
    {
        return inputValue ?? "";
    }

    /**
     * Retrieves the user's preference for showing this confirmation popup on future occurrences.
     * @returns {boolean} `true` to show again, `false` to hide in the future.
     */
    export function getShowConfirmationAgain(): boolean
    {
        return showConfirmationAgain;
    }

    let overlayElement: HTMLElement | null = $state(null);
    $effect(() => {
        overlayElement?.focus();
    }); //If we don't focus on the overlayElement, i.e. the container of this popup, then we won't be able to detect the on:keydown event
</script>

{#if showPopup}
    <div transition:blur|global
         class="overlay"
         onclick={() => {
            //The `(window.getSelection().toString().length === 0)` check ensures that selecting text won't cause the popup to close. If we were to press and hold the mouse button to select some text that's part of the popup. And then release the mouse button somewhere outside the popup. This would be considered as a click on this overlay element i.e. outside the popup, therefore closing the popup. With this check we only close the popup if we aren\'t selecting anything.
            if (window.getSelection().toString().length === 0)
            {
                answer = false;
                closePopup();
            }
         }}
         bind:this={overlayElement}
         onkeydown={handleKeyDown}
         tabindex="1"
    >
        <div transition:slide|global class="popup" onclick={(e) => e.stopPropagation()}>
            <!-- When the user clicks outside the popup, the popup should close. However, when the user clicks on the popup itself, the click event should not be captured by the containing/overlay div. In order to prevent the click event from propagating up to the overlay and triggering the closure of the popup, e.stopPropagation() is called-->
            <div class="titleDiv">
                <h1>{title}</h1>
                <svg onclick={() => {answer = false; closePopup()}} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5" >
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
            {#if showConfirmation}
                <div class="dontAskAgainContainer"
                     onclick={() => showConfirmationAgain = !showConfirmationAgain}
                >
                    <input
                        type="checkbox"
                        bind:checked={() => !showConfirmationAgain, checked => showConfirmationAgain = !checked}
                    />
                    <span>
                        {I18n.t("dontAskAgain")}
                    </span>
                </div>
            {/if}
            <div class="buttonsHolder">
                {#if buttonType === "yesno"}
                    <button class="cancelButton"
                            onclick={() => {
                                answer = false;
                                closePopup();
                            }}
                    >
                        {I18n.t("no")}
                    </button>
                    <button class="okButton"
                            onclick={() => {
                            answer = true;
                            closePopup();
                        }}
                    >
                        {I18n.t("yes")}
                    </button>
                {:else if buttonType === "ok"}
                    <button class="okButton"
                            onclick={() => {
                            answer = true;
                            closePopup();
                        }}
                    >
                        {I18n.t("ok")}
                    </button>
                {:else if buttonType === "input"}
                    <button class="cancelButton"
                            onclick={() => {
                                answer = false;
                                closePopup();
                            }}
                    >
                        {I18n.t("cancel")}
                    </button>
                    <button class="okButton"
                            onclick={() => {
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

    .dontAskAgainContainer {
        display: flex;
        align-items: center;
        gap: 0.25em;
        align-content: space-around;
        cursor: pointer;
        margin-bottom: 1em;
    }

    .dontAskAgainContainer span {
        width: 100%;
        transition: 0.2s;
        border-radius: 0.25em;
        padding: 0.25em;
        word-break: break-word;
        user-select: none;
    }
</style>