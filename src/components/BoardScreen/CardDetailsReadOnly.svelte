<script lang="ts">
    import type {Card, Label} from "../../scripts/Board";
    import Attachments from "./Attachments.svelte";
    import CheckLists from "./CheckLists.svelte";
    import DueDateChip from "./DueDateChip.svelte";
    import TipTap from "./Tiptap/Tiptap.svelte";

    interface Props {
        card: Card;
        labels: Label[];
        cardIsReadOnlyMessage: string;
        dueDateMessage: string;
        completedMessage: string;
        checklistMessage: string;
        attachmentsMessage: string;
    }

    let {
        card,
        labels,
        cardIsReadOnlyMessage,
        dueDateMessage,
        completedMessage,
        checklistMessage,
        attachmentsMessage,
    }: Props = $props();
</script>

<div class="container">
    {#if card.title.trim()}
        <h1 style={`text-decoration: ${card.complete ? "line-through" : "none"}`}>
            {card.title}
        </h1>
        <hr>
    {/if}

    <div class="labels">
        {#each labels as label}
            <div style="background-color: {label.color}">
                <span style="color: {label.titleColor}">
                    {label.title}
                </span>
            </div>
        {/each}
    </div>

    <div class="cardIsReadOnly">
        <span>{cardIsReadOnlyMessage}</span>
    </div>

   <DueDateChip dueDate={card.dueDate} complete={card.complete} readOnly={true} dueDateTitle={dueDateMessage} completedTitle={completedMessage}/>

    {#if card.description.trim()}
        <div class="markdown-body">
            <TipTap cardDescription={card.description} editable={false} />
        </div>
    {/if}

    <CheckLists checklists={card.checklists} readOnly={true} checklistTitlePlaceholder={checklistMessage} />
    <Attachments attachments={card.attachments} isCardFullscreen={true} readOnly={true} attachmentsTitle={attachmentsMessage} />
</div>

<style>
    .container {
        padding: 1em;
        background: var(--background-color);
        color: var(--main-text);
    }

    h1 {
        margin: 0 0 0.5em 0;
    }

    .labels {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5em;
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
        height: 1.5em;
        min-width: 2.5em;
        border-radius: 4px;
        transition: 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .labels div span {
        padding: 0 0.5em;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        max-width: 30em;
    }

    hr {
        border: 1px solid var(--border);
        margin-bottom: 0.75em;
    }

    .cardIsReadOnly {
        display: flex;
        background-color: var(--border);
        border-radius: 4px;
        border: none;
        align-items: center;
        gap: 0.5em;
        transition: 0.3s;
        height: 2em;
        font-size: medium;
        width: 100%;
        justify-content: center;
        margin-bottom: 0.5em;
        color: white;
    }

    .cardIsReadOnly {
        background-color: var(--warning);
    }

    .container :global(.todosHolder) {
        gap: 0.5em;
        margin-bottom: 1.5em;
    }
</style>

