<script lang="ts">
    import {SaveLoadManager} from "../../../scripts/SaveLoad/SaveLoadManager";
    import {I18n} from "../../../scripts/I18n/I18n";
    import {mount} from "svelte";
    import PopupWindow from "../../PopupWindow.svelte";
    import {info, warn} from "@tauri-apps/plugin-log";
    import {selectedBoardId, selectedCardId} from "../../../scripts/Stores.svelte.js";
    import type {Board, Card} from "../../../scripts/Board";

    interface Props {
        takmaLink: string;
    }

    let {
        takmaLink
    }: Props = $props();

    // Link to a card `takma://<board id>/<card id>`. Link to a board `takma://<board id>`
    // `takma:\/\/` - This part matches the literal characters "takma://" in the string.
    // `([\w-]+)` - This is the first capturing group (`(...)`) and it matches one or more word characters `(\w)` or hyphens (`-`). The hyphen is included within the character set `[\w-]`. Word characters include uppercase and lowercase letters, digits, and underscores. This capturing group captures the board ID.
    // `(?:\/([\w-]+))?` - This is a non-capturing group (`(?:...)`) followed by a question mark ?, which makes it optional. It matches a forward slash (`\/`) followed by one or more word characters or hyphens. The hyphen is included within the character set `[\w-]`. This capturing group captures the card ID, which is also allowed to contain hyphens. The non-capturing group is used because we're not interested in capturing the forward slash itself.
    // `/i` - This is a flag indicating case-insensitive matching. It allows the pattern to match both uppercase and lowercase characters.
    const TAKMA_LINK_PATTERN = /takma:\/\/([\w-]+)(?:\/([\w-]+))?/i;

    const [_, boardId, cardId]: (string | undefined)[] = takmaLink.match(TAKMA_LINK_PATTERN) || [];
    let board: undefined | Board = $state(undefined);
    let card : undefined | null | Card = $state(undefined);

    try {
        board = SaveLoadManager.getData().getBoard(boardId);
        card = SaveLoadManager.getData().getCard(boardId, cardId);
    }
    catch (ex) {
        warn(`Failed to retrieve board or card data for Takma link '${takmaLink}': ${ex}`);
    }

    function handleTakmaLinkClick(_: MouseEvent)
    {
        if (!board)
        {
            mount(PopupWindow, {props: {description: I18n.t("boardIdNotFound", takmaLink.toString()), buttonType: "ok"}, target: document.body, intro: true});
            return;
        }
        else if (cardId && !card)
        {
            mount(PopupWindow, {props: {description: I18n.t("cardIdNotFound", takmaLink.toString()), buttonType: "ok"}, target: document.body, intro: true});
            return;
        }

        info(`Opening Takma link with board: ${boardId} and card: ${cardId}`);
        if (board && card)
        {
            selectedBoardId.value = boardId!;
            selectedCardId.value = cardId!;
        }
        else if (board)
        {
            selectedBoardId.value = boardId!;
            selectedCardId.value = "";
        }
    }
</script>

<span onclick={handleTakmaLinkClick} class="takma-link">
    <span class="takma-linkBoardTitle">{board?.title ?? I18n.t("boardNotFound")}</span>
    {#if cardId}
        <span class="takma-linkCardTitle">{card?.title ?? I18n.t("cardNotFound")}</span>
    {/if}
</span>

<style>
    .takma-link {
        background: transparent;
        border: 2px solid var(--border);
        border-radius: 4px;
        align-items: center;
        padding: 0 0 1px 0;
        cursor: pointer;
        min-height: 1em;
    }

    .takma-linkBoardTitle {
        background: var(--border);
        padding: 0.25em;
        text-transform: uppercase;
        margin: 0;
        font-size: small;
        font-weight: bold;
        min-height: 1em;
        height: 100%;
        word-break: break-all;
    }

    .takma-linkCardTitle {
        color: var(--accent);
        font-style: italic;
        min-height: 1em;
        min-width: 2em;
        word-break: break-all;
        padding: 0 0.5em 0 0.25em;
    }
</style>