<script lang="ts">
    import type {Card, Checklist, TodoItem} from "../../scripts/Board";
    import {getImageUrl} from "../../scripts/GetImageUrl";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {draggingCardOrList, selectedBoardId, selectedCardId} from "../../scripts/stores";
    import {resizeImg} from "../../scripts/ResizeImg";

    export let card: Card;

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
</script>

<div class="cardContainer" on:click={displayCardDetails} tabindex="0" on:keydown={e => e.key === "Enter" && (displayCardDetails())}>
    {#if card.coverImageIndex !== -1 && $draggingCardOrList === false}
        <!--We only display/update the cover image of this card when we are not dragging any cards/lists. This is because as soon as we start dragging cards/lists we refresh the board/lists which causes all of the cover images to be rerendered. This makes it very laggy to drag/drop cards/lists if there are any cards with cover images. That is why we only display/update the cover image if we aren't dragging any cards/lists.-->
        {#await getImageUrl(card.attachments[card.coverImageIndex], SaveLoadManager.getSaveDirectory())}
            <span class="loader"></span>
        {:then coverImage}
            <img class="coverImage" src={coverImage} use:resizeImg/>
        {/await}
    {/if}
    <div class="nonCoverImageContainer">
        <div class="labels">
            {#each card.labelIds as labelId}
                <div style="background-color: {SaveLoadManager.getData().getLabelColor($selectedBoardId, labelId)}">
                </div>
            {/each}
        </div>
        <span class="cardTitle">
            {card.title}
        </span>
        {#if card.description !== "" || card.attachments.length > 0 || amountOfTodosInCard(card) > 0}
            <div class="icons">
                {#if card.description !== ""}
                    <svg style="height: 1.4em" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                    </svg>
                {/if}
                {#if card.attachments.length > 0}
                    <div class="attachments">
                        <svg style="height: 1em" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke-width="2" d="M22,12 C22,12 19.0000009,15.0000004 13.0000004,21.0000004 C6.99999996,27.0000004 -2.00000007,18.0000004 3.99999994,12.0000004 C9.99999996,6.00000037 9,7.00000011 13,3.00000008 C17,-0.999999955 23,4.99999994 19,9.00000005 C15,13.0000002 12.0000004,16.0000007 9.99999995,18.0000004 C7.99999952,20 5,17 6.99999995,15.0000004 C8.99999991,13.0000007 16,6 16,6"></path></svg>
                        {card.attachments.length}
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
    </div>
</div>

<style>
    .cardContainer {
        cursor: pointer;
        border-radius: 4px;
        border: 1px solid var(--border);
        background: rgba(var(--background-color-rgb-values), 0.5);
        transition: 0.3s;
    }

    .cardContainer:hover {
        background: var(--background-color);
        -webkit-box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.5);
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

    .attachments, .todos {
        display: flex;
        gap: 0.2em;
        align-items: center;
    }

    .coverImage {
        width: 100%;
        max-height: 15em;
        object-fit: contain;
    }

    .cardTitle {
        word-break: break-word;
    }
</style>