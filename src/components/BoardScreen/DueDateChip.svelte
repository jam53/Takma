<script lang="ts">
    import {I18n} from "../../scripts/I18n/I18n";
    import {mount} from "svelte";
    import DueDatePopup from "./DueDatePopup.svelte";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {slide} from "svelte/transition";

    interface Props {
        dueDate: string|null;
        complete: boolean;
        focusOnCardDetailsFunction: Function;
        readOnly?: boolean;
        dueDateTitle?: string;
        completedTitle?: string;
    }

    let {
        dueDate = $bindable(),
        complete = $bindable(),
        focusOnCardDetailsFunction,
        readOnly = false,
        dueDateTitle = undefined,
        completedTitle = undefined,
    }: Props = $props();
</script>

{#if dueDate !== null}
    <button class="dueDate"
            title={I18n.t("dueDate")}
            class:dueDateOrange={parseInt(dueDate) - Date.now() < 86400000 && Date.now() <= parseInt(dueDate)}
            class:dueDateRed={Date.now() > parseInt(dueDate)}
            style={`background-color: ${complete ? "var(--success)" : ""}; pointer-events: ${readOnly ? "none" : "auto"}`}
            onclick={e => mount(DueDatePopup, {props: {clickEvent: e, dueDate: dueDate, setDueDate: newDueDate => dueDate = newDueDate, focusOnCardDetailsFunction: focusOnCardDetailsFunction}, target: document.body, intro: true})}
    >
        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"></path></svg>
        <span>
                {dueDateTitle ?? (new Date(parseInt(dueDate))).toLocaleString(SaveLoadManager.getData().displayLanguage, {dateStyle: "full", timeStyle: "short", hourCycle: 'h23'})}
        </span>
    </button>
{:else if dueDate === null && complete}
    <button class="completed"
            in:slide
            out:slide
            title={I18n.t("completed")}
            style={`background-color: var(--success); pointer-events: ${readOnly ? "none" : "auto"}`}
            onclick={e => complete = !complete}
    >
        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"></path></svg>
        <span>
                {completedTitle ?? I18n.t("completed")}
        </span>
    </button>
{/if}

<style>
    .dueDate, .completed {
        display: flex;
        background-color: var(--border);
        border-radius: 4px;
        border: none;
        align-items: center;
        gap: 0.5em;
        cursor: pointer;
        transition: 0.3s;
        height: 2em;
        font-size: medium;
        width: 100%;
        justify-content: center;
        margin-bottom: 0.5em;
        color: white;
    }

    .dueDateRed {
        background-color: var(--danger);
    }

    .dueDateOrange {
        background-color: var(--warning);
    }

    .dueDate:hover, .completed:hover {
        filter: brightness(70%);
    }

    .dueDate svg {
        width: 1.5em;
        height: 1.5em;
    }

    .completed svg {
        width: 1.25em;
        height: 1.25em;
    }
</style>