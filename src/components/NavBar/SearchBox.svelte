<script lang="ts">
    import {type Board, type Card, cardContainsString} from "../../scripts/Board";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {searchBarValue, selectedBoardId, selectedCardId} from "../../scripts/Stores.svelte";
    import {getThumbnail} from "../../scripts/ThumbnailGenerator";
    import {slide} from "svelte/transition";
    import {flip} from "svelte/animate";
    import {clickOutside} from "../../scripts/ClickOutside";
    import {performSearchInText} from "../../scripts/SearchText";
    import {I18n} from "../../scripts/I18n/I18n";

    interface Props {
        showSearchBox: boolean,
        closeSearchBar: () => void
    }

    let {showSearchBox, closeSearchBar}: Props = $props();

    let filteredCards: {
        card: Card,
        listTitle: string,
        boardTitle: string,
        boardId: string,
        isBoardArchived: boolean
    }[] = $derived(
        SaveLoadManager.getData().boards.flatMap(board =>
            board.lists.flatMap(list =>
                list.cards
                    .filter(card =>
                        cardContainsString(card, searchBarValue.value) && !(hideArchivedCards && board.archived)
                    )
                    .map(card => ({
                        card,
                        listTitle: list.title,
                        boardTitle: board.title,
                        boardId: board.id,
                        isBoardArchived: board.archived
                    }))
            )
        )
    );

    let filteredBoards: Board[] = $derived(
        SaveLoadManager.getData().boards.filter(board =>
            performSearchInText(searchBarValue.value, board.title.toLowerCase())
        )
    );

    let showAllMatchedCards: boolean = $derived(!showSearchBox); // Reset to false when search box becomes visible
    let hideArchivedCards: boolean = $derived(!showSearchBox); // Reset to false when search box becomes visible
    const CARDS_SHOWN_BY_DEFAULT = 10;


    /**
     * Highlights all occurrences of query words or exact phrases inside text.
     *
     * Behavior:
     * - Quoted phrases (e.g., '"project scope"') are highlighted exactly as a unit.
     * - Unquoted words are highlighted individually (e.g., 'one three' highlights 'one' and 'three').
     *
     * Example:
     * highlightText('one two three four', 'one three')
     * → '<span class="highlightText">one</span> two <span class="highlightText">three</span> four'
     *
     * highlightText('project scope planning', '"project scope" plan')
     * → '<span class="highlightText">project scope</span> <span class="highlightText">plan</span>ning'
     */
    function highlightText(text: string, query: string): string {
        if (!query) {
            return text
        }

        // Find quoted phrases
        const phraseMatches: string[] = [];
        const quotedRegex = /"([^"]+)"/g;
        let match;
        while ((match = quotedRegex.exec(query)) !== null) {
            if (match[1].trim()) phraseMatches.push(match[1].trim());
        }

        // Find remaining unquoted words
        const unquoted = query
            .replace(/"[^"]*"/g, " ") // remove quoted parts
            .trim()
            .split(/\s+/)
            .filter(w => w.length > 0);

        const allTerms = [...phraseMatches, ...unquoted];

        if (allTerms.length === 0) {
            return text
        }

        // Escape regex special characters for each term
        const escapedTerms = allTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

        // Build regex that matches any term, global & case-insensitive
        const regex = new RegExp(`(${escapedTerms.join("|")})`, "gi");

        // Replace all matches with highlighted span
        return text.replace(regex, `<span class="highlightText">$1</span>`);
    }
</script>

{#if showSearchBox}
    <div class="searchBox"
         in:slide
         out:slide
         use:clickOutside
         onclick_outside={() => searchBarValue.value !== "" && closeSearchBar()}
    >
        {#if !searchBarValue.value.trim()}
            <div class="markdown-body">
                {@html I18n.t("searchTips")}
            </div>
        {:else}
            {#if filteredCards.length > 0}
                <h5>
                    {I18n.t("cards")}
                </h5>
                <div class="items">
                    {#each showAllMatchedCards ? filteredCards : filteredCards.slice(0, CARDS_SHOWN_BY_DEFAULT) as card (card.card.id)}
                        <div class="item" animate:flip="{{duration: 500}}" onclick={() => {
                    selectedBoardId.value = card.boardId;
                    selectedCardId.value = card.card.id;

                    closeSearchBar();
                }}>
                            {#if card.isBoardArchived}
                                <svg stroke=" var(--main-text)"
                                     fill="currentColor" stroke-width="0" viewBox="0 0 16 16"
                                     xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.643 15C13.979 15 15 13.845 15 12.5V5H1v7.5C1 13.845 2.021 15 3.357 15zM5.5 7h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1M.8 1a.8.8 0 0 0-.8.8V3a.8.8 0 0 0 .8.8h14.4A.8.8 0 0 0 16 3V1.8a.8.8 0 0 0-.8-.8z"></path>
                                </svg>
                            {:else}
                                <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="512" height="512" rx="50" fill="transparent"/>
                                    <rect x="65" y="67" width="158" height="380" rx="25" fill="var(--main-text)"/>
                                    <rect x="288" y="67" width="158" height="158" rx="25" fill="var(--main-text)"/>
                                    <rect x="288" y="289" width="158" height="158" rx="25" fill="var(--main-text)"/>
                                </svg>
                            {/if}
                            <div class="itemText">
                                <p>
                                    {@html highlightText(card.card.title, searchBarValue.value)}
                                </p>
                                <p style="font-size: small; font-weight: 200">
                                    {card.boardTitle} {card.boardTitle && card.listTitle ? "•" : ""} {card.listTitle}
                                </p>
                            </div>
                        </div>
                    {/each}
                </div>
                {#if filteredCards.length > CARDS_SHOWN_BY_DEFAULT && !showAllMatchedCards}
                    <p class="showMoreCards" onclick={() => showAllMatchedCards = true}>
                        {I18n.t("showAllCards")}
                    </p>
                {:else if filteredCards.length > CARDS_SHOWN_BY_DEFAULT && !hideArchivedCards}
                    <p class="showMoreCards" onclick={() => hideArchivedCards = true}>
                        {I18n.t("hideArchivedCards")}
                    </p>
                {/if}
            {/if}
            {#if filteredCards.length > 0 && filteredBoards.length > 0}
                <hr>
            {/if}
            {#if filteredBoards.length > 0}
                <h5>
                    {I18n.t("boards")}
                </h5>
                <div class="items">
                    {#each filteredBoards as board}
                        <div class="item" onclick={() => {
                    selectedBoardId.value = board.id;

                    closeSearchBar();
                }}>
                            {#await getThumbnail(board.backgroundImagePath, 100)}
                                <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="512" height="512" rx="50" fill="transparent"/>
                                    <rect x="65" y="67" width="158" height="380" rx="25" fill="var(--main-text)"/>
                                    <rect x="288" y="67" width="158" height="158" rx="25" fill="var(--main-text)"/>
                                    <rect x="288" y="289" width="158" height="158" rx="25" fill="var(--main-text)"/>
                                </svg>
                            {:then src}
                                <img {src}/>
                            {/await}
                            <div class="itemText">
                                <p>
                                    {@html highlightText(board.title, searchBarValue.value)}
                                </p>
                                <div>
                                    {#if board.favourite}
                                        <svg fill="var(--warning)" stroke-width="0"
                                             viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"></path>
                                        </svg>
                                    {/if}
                                    {#if board.archived}
                                        <svg stroke="var(--main-text)"
                                             fill="currentColor" stroke-width="0" viewBox="0 0 16 16"
                                             xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12.643 15C13.979 15 15 13.845 15 12.5V5H1v7.5C1 13.845 2.021 15 3.357 15zM5.5 7h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1M.8 1a.8.8 0 0 0-.8.8V3a.8.8 0 0 0 .8.8h14.4A.8.8 0 0 0 16 3V1.8a.8.8 0 0 0-.8-.8z"></path>
                                        </svg>
                                    {/if}
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
            {#if filteredCards.length === 0 && filteredBoards.length === 0}
                <p style="text-align: center">
                    {I18n.t("noResultsFound")}
                </p>
            {/if}
        {/if}
    </div>
{/if}

<style>

    .searchBox {
        position: absolute;
        top: 3em;
        right: 1em;
        border: red solid 1px;
        width: clamp(10em, 40em, 80%);
        padding: 0.5em;
        overflow: auto;

        z-index: 1;
        background-color: rgba(var(--background-color-rgb-values), 0.5);
        backdrop-filter: blur(10px);
        border-radius: 5px;
        max-height: max(60vh, 15em);
        flex-direction: column;
        border: 1px solid rgba(var(--background-color-rgb-values), 0.4);
        box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
    }

    .items {
        display: flex;
        flex-flow: column;
    }

    .itemText {
        display: flex;
        flex-flow: column;
        min-width: 0;
        gap: 0.1em;
    }

    .itemText svg {
        width: 1em !important;
        min-width: 1em !important;
    }

    .item {
        display: flex;
        align-items: center;
        transition: 0.3s;
        padding: 0.2em 0.25em;
        gap: 0.5em;
    }

    .item:hover {
        text-align: left;
        border-radius: 5px;
        background-color: rgba(var(--background-color-rgb-values), 0.8);
        box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
        cursor: pointer;
    }

    .item p {
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .item svg, .item img {
        width: 2em;
        min-width: 2em;
        border-radius: 0.25em;
        object-fit: cover;
    }

    .item img {
        height: 2em;
        min-height: 2em;
    }

    h5 {
        margin: 0.5em;
    }

    :global(.highlightText) {
        background-color: yellow;
        color: black;
        font-weight: bold;
    }

    .markdown-body {
        padding: 0.25em 0.5em;
    }

    .markdown-body :global(p), .markdown-body :global(li) {
        color: var(--main-text);
    }

    hr {
        border: none;
        border-bottom: 1px solid var(--main-text);
        margin: 0.5em 0;
    }

    .showMoreCards {
        text-align: center;
        transition: 0.3s;
        text-decoration: underline;
        text-decoration-color: transparent;
    }

    .showMoreCards:hover {
        cursor: pointer;
        text-decoration-color: var(--main-text);
    }
</style>