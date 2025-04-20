<script lang="ts">
    import {SaveLoadManager} from "../../../scripts/SaveLoad/SaveLoadManager";
    import {I18n} from "../../../scripts/I18n/I18n";
    import {mount} from "svelte";
    import PopupWindow from "../../PopupWindow.svelte";
    import {selectedBoardId, selectedCardId} from "../../../scripts/Stores.svelte.js";

    interface Props {
        takmaLink: string;
    }

    let {
        takmaLink
    }: Props = $props();

    const TAKMA_LINK_PATTERN = /takma:\/\/([\w-]+)(?:\/([\w-]+))?/i; //Link to a card `takma://<board id>/<card id>`. Link to a board `takma://<board id>`
    // `takma:\/\/` - This part matches the literal characters "takma://" in the string.
    // `([\w-]+)` - This is the first capturing group (`(...)`) and it matches one or more word characters `(\w)` or hyphens (`-`). The hyphen is included within the character set `[\w-]`. Word characters include uppercase and lowercase letters, digits, and underscores. This capturing group captures the board ID.
    // `(?:\/([\w-]+))?` - This is a non-capturing group (`(?:...)`) followed by a question mark ?, which makes it optional. It matches a forward slash (`\/`) followed by one or more word characters or hyphens. The hyphen is included within the character set `[\w-]`. This capturing group captures the card ID, which is also allowed to contain hyphens. The non-capturing group is used because we're not interested in capturing the forward slash itself.
    // `/i` - This is a flag indicating case-insensitive matching. It allows the pattern to match both uppercase and lowercase characters.
    const BOARD_NOT_FOUND_TRANSLATION = I18n.t("boardNotFound");
    const CARD_NOT_FOUND_TRANSLATION = I18n.t("cardNotFound");

    const [_, boardId, cardId] = takmaLink.match(TAKMA_LINK_PATTERN) || [];
    let boardTitle: undefined | string = $state(undefined);
    let cardTitle: undefined | string = $state(undefined);

    try
    {
        boardTitle = SaveLoadManager.getData().getBoard(boardId).title;
        cardTitle = SaveLoadManager.getData().getCard(boardId, cardId).title;
    }
    catch (_)
    {
        boardTitle = boardTitle ?? BOARD_NOT_FOUND_TRANSLATION;
        cardTitle = cardId === undefined ? "" : CARD_NOT_FOUND_TRANSLATION;
    }

    function handleTakmaLinkClick(_: MouseEvent)
    {
        if (boardTitle === BOARD_NOT_FOUND_TRANSLATION)
        {
            mount(PopupWindow, {props: {description: I18n.t("boardIdNotFound", takmaLink.toString()), buttonType: "ok"}, target: document.body, intro: true});
            return;
        }
        else if (cardTitle === CARD_NOT_FOUND_TRANSLATION)
        {
            mount(PopupWindow, {props: {description: I18n.t("cardIdNotFound", takmaLink.toString()), buttonType: "ok"}, target: document.body, intro: true});
            return;
        }

        if (boardTitle !== BOARD_NOT_FOUND_TRANSLATION && cardTitle !== CARD_NOT_FOUND_TRANSLATION)
        {
            selectedBoardId.value = boardId;
            selectedCardId.value = cardId;
        }
        else if (boardTitle !== BOARD_NOT_FOUND_TRANSLATION)
        {
            selectedBoardId.value = boardId;
            selectedCardId.value = "";
        }
    }
</script>

<span onclick={handleTakmaLinkClick} class="takma-link">
    <span class="takma-linkBoardTitle">{boardTitle}</span>
    <span class="takma-linkCardTitle">{cardTitle}</span>
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