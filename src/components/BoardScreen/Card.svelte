<script lang="ts">
    import type {Card, TodoItem} from "../../scripts/Board";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {draggingCardOrList, selectedBoardId, selectedCardId} from "../../scripts/stores";
    import {exists} from "@tauri-apps/api/fs";
    import CardOptionsMenu from "./CardOptionsMenu.svelte";
    import {convertFileSrc} from "@tauri-apps/api/tauri";
    import {scaleDownImage} from "../../scripts/ScaleDownImage";

    export let card: Card;
    export let refreshListFunction; //Used to visually refresh the list this card is in
    export let refreshListsFunction; //Used to visually refresh all the lists on this board
    export let listIdCardIsIn;

    function displayCardDetails()
    {
        $selectedCardId = card.id
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
    async function amountOfExistingAttachments(attachments: String[])
    {
        let amount = 0;

        for (let attachment of attachments)
        {
            if (await exists(attachment, {dir: SaveLoadManager.getSaveDirectory()}) && attachment !== "")
            {
                amount++;
            }
        }

        return amount;
    }

    let hovering = false; //Is this component being hovered over
    let shiftKeyPressed = false;
    window.addEventListener("keydown", e => e.key === "Shift" && (shiftKeyPressed = true));
    window.addEventListener("keyup", e => e.key === "Shift" && (shiftKeyPressed = false));
</script>

<div class="cardContainer" tabindex="0"
     on:click={() => {
         if (hovering && shiftKeyPressed)
         {
             SaveLoadManager.getData().deleteCard($selectedBoardId, card.id);
             refreshListFunction();
         }
         else
         {
             displayCardDetails();
         }
     }}
     on:contextmenu|preventDefault={e => {
         (new CardOptionsMenu({props: {cardId: card.id, refreshListsFunction: refreshListFunction, listIdCardIsIn: listIdCardIsIn}, target: document.body, intro: true})).openContextMenu(e);
     }}
     class:deleteCard={hovering && shiftKeyPressed}
     on:keydown={e => e.key === "Enter" && displayCardDetails()}
     on:mouseenter={() => hovering = true}
     on:mouseleave={() => hovering = false}
>
    {#if card.coverImage !== "" && $draggingCardOrList === false}
        <!--We only display/update the cover image of this card when we are not dragging any cards/lists. This is because as soon as we start dragging cards/lists we refresh the board/lists which causes all of the cover images to be rerendered. This makes it very laggy to drag/drop cards/lists if there are any cards with cover images. That is why we only display/update the cover image if we aren't dragging any cards/lists.-->
        {#await (async () => await scaleDownImage(convertFileSrc(await SaveLoadManager.getAbsoluteSaveDirectory() + card.coverImage), 600))()}
            <span class="loader"></span>
        {:then coverImage}
            <img class="coverImage" src={coverImage} />
        {/await}
    {/if}
    <div class="nonCoverImageContainer">
        <div class="labels">
            {#each card.labelIds.map(labelId => SaveLoadManager.getData().getLabel($selectedBoardId, labelId)) as label}
                {#key card}
                    <!--This #key will be triggerd when we call the `refreshListsFunction()` after clicking on a label. If we don't do this #key, the labels won't change their appearance until the next time we open this board/refresh the cards in the lists by dragging a card/list e.g.-->
                    {#if !SaveLoadManager.getData().showLabelsText}
                        <div style="background-color: {label.color}"
                             on:click|stopPropagation={() => {SaveLoadManager.getData().showLabelsText = true; refreshListsFunction()}}
                        >
                        </div>
                    {:else}
                        <span style="color: {label.titleColor}; background-color: {label.color}"
                              on:click|stopPropagation={() => {SaveLoadManager.getData().showLabelsText = false; refreshListsFunction()}}
                        >
                            {label.title}
                        </span>
                    {/if}
                {/key}
            {/each}
        </div>
        <span class="cardTitle">
            {card.title}
        </span>
        {#await amountOfExistingAttachments(card.attachments)}
        {:then amountOfExistingAttachments}
        {#if card.dueDate !== null || card.description !== "" || amountOfExistingAttachments > 0 || amountOfTodosInCard(card) > 0}
            <div class="icons">
                {#if card.dueDate !== null}
                    <div class="dueDate"
                         class:dueDateOrange={parseInt(card.dueDate) - Date.now() < 86400000 && Date.now() <= parseInt(card.dueDate)}
                         class:dueDateRed={Date.now() > parseInt(card.dueDate)}
                    >
                        <svg style="height: 1.15em; margin-right: 0.1em" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"></path></svg>
                        {`${(new Date(parseInt(card.dueDate))).toLocaleString("default", {dateStyle: "medium"}).replace(", " + (new Date(Date.now())).getFullYear(), "")}`}
                    </div>
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
        -webkit-box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.5);
    }

    :is(.deleteCard):hover {
        background: var(--danger);
        border: 1px solid var(--danger);
        background-image: url("data:image/svg+xml;charset=utf-8, %3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath fill-rule='evenodd' d='M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z' clip-rule='evenodd' /%3E%3C/svg%3E"); /* https://stackoverflow.com/a/41407516 */
        background-repeat: no-repeat;
        background-position: center;
        min-height: 2em;
    }

    :is(.deleteCard img), :is(.deleteCard div) {
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

    .labels div {
        height: 0.5em;
        width: 2.4em;
        border-radius: 100px;
        transition: 0.2s;
    }

    .labels span {
        min-width: 2.4em;
        height: 1.2em;
        text-overflow: ellipsis;
        overflow: hidden;
        border-radius: 0.25em;
        padding: 0 0.25em;
        white-space: nowrap;
        text-align: center;
        transition: 0.2s;
    }

    .labels div:hover, .labels span:hover {
        filter: brightness(70%);
    }

    .icons {
        display: flex;
        gap: 1em;
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
        max-height: 15em;
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