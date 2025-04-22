<script lang="ts">
    import type {Card, List, TodoItem} from "../../scripts/Board";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {
        invalidateLabels,
        selectedBoardId,
        selectedCardId,
    } from "../../scripts/Stores.svelte.js";
    import {exists} from "@tauri-apps/plugin-fs";
    import CardOptionsMenu from "./CardOptionsMenu.svelte";
    import {getThumbnail} from "../../scripts/ThumbnailGenerator";
    import {join} from "@tauri-apps/api/path";
    import {mount} from "svelte";

    interface Props {
        card: Card;
        list: List;
        showLabelsText: boolean;
    }

    let {
        card,
        list = $bindable(),
        showLabelsText = $bindable(),
    }: Props = $props();

    function displayCardDetails()
    {
        selectedCardId.value = card.id;
    }

    function amountOfTodosInCard(cardd: Card, completedOnly = false)
    {
        let todos: TodoItem[] = [];

        cardd.checklists?.forEach(checklist => todos = [...todos, ...checklist.todos]);

        return completedOnly ? (todos.filter(todo => todo.completed)).length : todos.length;
    }

    /**
     * Given a list of attachments, returns the amount of attachments that actually exist on the disk
     */
    async function amountOfExistingAttachments(attachments: string[])
    {
        let amount = 0;

        for (let attachment of attachments)
        {
            if (attachment !== "" && await exists(await join(SaveLoadManager.getSaveDirectoryPath(), attachment)))
            {
                amount++;
            }
        }

        return amount;
    }

    let hovering = $state(false); //Is this component being hovered over
    let shiftKeyPressed = $state(false);
    window.addEventListener("keydown", e => e.key === "Shift" && (shiftKeyPressed = true));
    window.addEventListener("keyup", e => e.key === "Shift" && (shiftKeyPressed = false));

    let preProcessedCoverImgSrc = $state("");
    $effect(() => {
        card.coverImage !== "" && (async () => preProcessedCoverImgSrc = await getThumbnail(card.coverImage, 600))();
    });
    // This reactive statement ensures that whenever the card's cover image is not an empty string (i.e. if the card has a cover image),
    // we asynchronously fetch and store a pre-processed version of the cover image.
    // This pre-processed thumbnail is saved in the `preProcessedCoverImgSrc` variable and is used for smoother drag-and-drop behavior.
    // The asynchronous function runs immediately and updates the value of `preProcessedCoverImgSrc` once the thumbnail is fetched.
    /*
     Explanation:
     - The goal is to improve the drag-and-drop experience by addressing layout shifts caused by image loading.
     - When the card component is dragged, the UI often refreshes, and this frequent redraw causes the cover image
       to be fetched repeatedly in the normal flow. Each time the image is fetched asynchronously, a loading spinner is
       displayed temporarily before the image is ready. This loader is often a different size than the final image,
       causing a layout shift, where the height of the card changes unpredictably. This affects the drag-and-drop
       experience because other cards in the list will shift as their height is adjusted to fit the loaded image.
     - To avoid this issue, we pre-fetch and store the cover image before the drag starts.
       This allows the card to display an immediate image without showing the loader and prevents the height from changing.
     - While dragging:
         - The pre-processed thumbnail (low-res image) is shown instead of the loading indicator,
           maintaining a consistent height for the card.
     - Once dragging finishes, the full-resolution image is fetched again and displayed, replacing the pre-processed version.
       This switch happens seamlessly, avoiding any significant layout shifts during the drag action.
     */
</script>

<div class="cardContainer" tabindex="0"
     onclick={() => {
         if (hovering && shiftKeyPressed)
         {
             SaveLoadManager.getData().deleteCard(selectedBoardId.value, card.id);
             list = SaveLoadManager.getData().getList(selectedBoardId.value, list.id);
         }
         else
         {
             displayCardDetails();
         }
     }}
     oncontextmenu={e => {
         e.preventDefault();

         mount(CardOptionsMenu, {
             props: {
                 clickEvent: e,
                 card: card,
                 list: list,
                 setList: newList => list = newList,
             },
             target: document.body,
             intro: true
         });
     }}
     class:deleteCard={hovering && shiftKeyPressed}
     onkeydown={e => e.key === "Enter" && displayCardDetails()}
     onmouseenter={() => hovering = true}
     onmouseleave={() => hovering = false}
>
    {#if card.coverImage !== ""}
        <img class="coverImage" src="{preProcessedCoverImgSrc}"/>
    {/if}
    <div class="nonCoverImageContainer">
        <div class="labels">
            {#each card.labelIds.map(labelId => SaveLoadManager.getData().getLabel(selectedBoardId.value, labelId)) as label}
                {#key invalidateLabels.value}
                    <span style="color: {label.titleColor}; background-color: {label.color}"
                          class="{showLabelsText ? 'labelsWithText' : 'labelsWithoutText'}"
                          onclick={e => {
                              e.stopPropagation();
                              SaveLoadManager.getData().showLabelsText = !SaveLoadManager.getData().showLabelsText;
                              showLabelsText = SaveLoadManager.getData().showLabelsText;
                          }}
                    >
                        {#if showLabelsText}
                            {label.title}
                        {/if}
                    </span>
                {/key}
            {/each}
        </div>
        <span class="cardTitle" style={`text-decoration: ${card.complete ? "line-through" : "none"}`}>
            {card.title}
        </span>
        {#await amountOfExistingAttachments(card.attachments)}
        {:then amountOfExistingAttachments}
        {#if card.dueDate !== null || card.description !== "" || amountOfExistingAttachments > 0 || amountOfTodosInCard(card) > 0 || card.complete}
            <div class="icons">
                {#if card.dueDate !== null}
                    <div class="dueDate"
                         class:dueDateOrange={parseInt(card.dueDate) - Date.now() < 86400000 && Date.now() <= parseInt(card.dueDate)}
                         class:dueDateRed={Date.now() > parseInt(card.dueDate)}
                         style={`color: ${card.complete ? "var(--success)" : ""}`}
                         title={new Date(parseInt(card.dueDate)).toLocaleString(SaveLoadManager.getData().displayLanguage, {dateStyle: "full", timeStyle: "short", hourCycle: "h23"})}
                    >
                        <svg style="height: 1.15em; margin-right: 0.1em" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"></path></svg>
                        <div style="white-space: nowrap; overflow: hidden">
                            {`${(new Date(parseInt(card.dueDate))).toLocaleString(SaveLoadManager.getData().displayLanguage, {minute: "numeric", hour: "numeric", hourCycle: "h23", day: "numeric", month: "long"})}`}
                        </div>
                    </div>
                {/if}
                {#if card.complete && card.dueDate === null}
                    <svg stroke="var(--success)" fill="var(--success)" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"></path></svg>
                {/if}
                {#if card.description !== ""}
                    <svg style="height: 1.4em" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                    </svg>
                {/if}
                {#if amountOfExistingAttachments > 0}
                    <div class="attachments">
                        <svg style="height: 1em" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke-width="2" d="M22,12 C22,12 19.0000009,15.0000004 13.0000004,21.0000004 C6.99999996,27.0000004 -2.00000007,18.0000004 3.99999994,12.0000004 C9.99999996,6.00000037 9,7.00000011 13,3.00000008 C17,-0.999999955 23,4.99999994 19,9.00000005 C15,13.0000002 12.0000004,16.0000007 9.99999995,18.0000004 C7.99999952,20 5,17 6.99999995,15.0000004 C8.99999991,13.0000007 16,6 16,6"></path></svg>
                        {amountOfExistingAttachments}
                    </div>
                {/if}
                {#if amountOfTodosInCard(card) > 0}
                    <div class="todos">
                        <svg style="height: 1em" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M168.531 215.469l-29.864 29.864 96 96L448 128l-29.864-29.864-183.469 182.395-66.136-65.062zm236.802 189.864H106.667V106.667H320V64H106.667C83.198 64 64 83.198 64 106.667v298.666C64 428.802 83.198 448 106.667 448h298.666C428.802 448 448 428.802 448 405.333V234.667h-42.667v170.666z"></path></svg>
                        {`${amountOfTodosInCard(card, true)}/${amountOfTodosInCard(card)}`}
                    </div>
                {/if}
            </div>
        {/if}
        {/await}
    </div>
</div>

<style>
    .cardContainer {
        cursor: pointer;
        border-radius: 4px;
        border: 1px solid var(--border);
        background: rgba(var(--background-color-rgb-values), 0.5);
        background-position: center;
        transition: 0.3s;
        min-height: 1em;
        user-select: none;
    }

    .cardContainer:hover {
        background: var(--background-color);
        box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.5);
    }

    :global(.deleteCard):hover {
        background: var(--danger) !important;
        border: 1px solid var(--danger) !important;
        background-image: url("data:image/svg+xml;charset=utf-8, %3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath fill-rule='evenodd' d='M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z' clip-rule='evenodd' /%3E%3C/svg%3E") !important; /* https://stackoverflow.com/a/41407516 */
        background-repeat: no-repeat !important;
        background-position: center !important;
        min-height: 2em !important;
    }

    :global(.deleteCard img), :global(.deleteCard div) {
        visibility: hidden;
    }

    .nonCoverImageContainer {
        padding: 0.5em;
    }

    .labels {
        padding-bottom: 0.5em;
        display: flex;
        gap: 0.5em;
        flex-wrap: wrap;
    }

    .labels:empty {
        padding: 0;
    }

    .labels span:hover {
        filter: brightness(70%);
    }

    .labelsWithoutText {
        height: 0.5em;
        width: 2.4em;
        border-radius: 100px;
        transition: 0.2s;
    }

    .labelsWithText {
        min-width: 2.4em;
        height: 1.35em;
        text-overflow: ellipsis;
        overflow: hidden;
        border-radius: 0.25em;
        padding: 0 0.25em;
        white-space: nowrap;
        text-align: center;
        transition: 0.2s;
    }

    .icons {
        display: flex;
        flex-flow: row wrap;
        column-gap: 1em;
        row-gap: 0.25em;
        align-items: center;
        padding-top: 0.5em;
    }

    .icons:empty {
        padding: 0;
    }

    .attachments, .todos, .dueDate {
        display: flex;
        gap: 0.2em;
        align-items: center;
    }

    .coverImage {
        width: 100%;
        max-height: 13em;
        min-height: 5em;
        object-fit: contain;
        border-radius: 4px 4px 0 0;
    }

    .cardTitle {
        word-break: break-word;
    }

    .dueDateRed {
        color: var(--danger);
    }

    .dueDateOrange {
        color: var(--warning);
    }
</style>