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
     *
     *
     *
     * await popup.getAnswer();
     * ```
     */

    export let title: string | null;
    export let description: string;
    export let buttonType: "yesno" | "ok";

    let showPopup = true;
    let answer: boolean | null = null;

    onMount(() =>
    {
        title = title ?? "Takma";

        window.addEventListener("keydown", e => {
            if (e.key === "Escape" || (e.key === "w" && e.ctrlKey))
            {
                showPopup = false;
            }
            else if (e.key === "Enter")
            {
                answer = true;
                showPopup = false;
                e.stopPropagation();
                e.preventDefault();
            }
        });
    });

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
</script>

{#if showPopup}
    <div transition:blur|global class="overlay" on:click={() => showPopup = false}>
        <div transition:slide|global class="popup" on:click={(e) => e.stopPropagation()}>
            <!-- When the user clicks outside the popup, the popup should close. However, when the user clicks on the popup itself, the click event should not be captured by the containing/overlay div. In order to prevent the click event from propagating up to the overlay and triggering the closure of the popup, e.stopPropagation() is called-->
            <div class="titleDiv">
                <h1>{title}</h1>
                <svg on:click={() => showPopup = false} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5" >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <hr/>
            <p>
                {@html description}
            </p>
            <div class="buttonsHolder">
                {#if buttonType === "yesno"}
                    <button class="cancelButton"
                            on:click={() => {
                                answer = false;
                                showPopup = false;
                            }}
                    >
                        {I18n.t("no")}
                    </button>
                    <button class="okButton"
                            on:click={() => {
                            answer = true;
                            showPopup = false;
                        }}
                    >
                        {I18n.t("yes")}
                    </button>
                {:else if buttonType === "ok" }
                    <button class="okButton"
                            on:click={() => {
                            answer = true;
                            showPopup = false;
                        }}
                    >
                        {I18n.t("ok")}
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
</style>