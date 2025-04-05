<script lang="ts">
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {mount} from "svelte";
    import {scale} from "svelte/transition";
    import {getThumbnail} from "../../scripts/ThumbnailGenerator";
    import BoardOptionsMenu from "./BoardOptionsMenu.svelte";
    import {selectedBoardId} from "../../scripts/Stores.svelte.js";
    import type {Board} from "../../scripts/Board";

    interface Props {
        image: string;
        title: string;
        board: Board;
        boards: Board[];
    }

    let {
        image,
        title,
        board = $bindable(),
        boards = $bindable(),
    }: Props = $props();

    /**
     * This function gets called when we click on the favourite icon of a board
     */
    function handleFavouriteClick(e: MouseEvent)
    {
        board.favourite = !board.favourite;

        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * This function gets called when we click on the archive icon of a board
     */
    function handleArchiveClick(e: MouseEvent)
    {
        board.archived = !board.archived;

        e.preventDefault();
        e.stopPropagation();
    }
</script>

{#await (async () => await getThumbnail(image, 600))()}
    <button class="boardButtons">
        <span class="loader"></span>
    </button>
{:then imgSrc}
    <button
        in:scale|global
        class="boardButtons"
        onclick={() => {
            selectedBoardId.value = board.id;
            SaveLoadManager.getData().setBoardLastOpenedTime(selectedBoardId.value);
        }}
        oncontextmenu={e => {
            e.preventDefault();

            mount(BoardOptionsMenu, {
                props: {
                    clickEvent: e,
                    board: board,
                    setBoards: newBoards => boards = newBoards,
                },
                target: document.body,
                intro: true
            });
        }}
    >
        <img src={imgSrc} />
        <div class="bottomBar">
            <h2>
                {title}
            </h2>
        </div>
        <div class="iconsHolder">
            {#if board.favourite}
                <svg onclick={handleFavouriteClick} class="favouriteFilled" stroke="currentColor" stroke-width="0" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"></path></svg>
            {:else}
                <svg onclick={handleFavouriteClick} class="favourite" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.6 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0zm0 79L235.4 187.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9 184.9 303c5.5 5.5 8.1 13.3 6.8 21L171.4 443.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2L384.2 324.1c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1L358.6 200.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z"></path></svg>
            {/if}
            {#if board.archived}
                <svg onclick={handleArchiveClick} class="archiveFilled" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M12.643 15C13.979 15 15 13.845 15 12.5V5H1v7.5C1 13.845 2.021 15 3.357 15zM5.5 7h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1 0-1M.8 1a.8.8 0 0 0-.8.8V3a.8.8 0 0 0 .8.8h14.4A.8.8 0 0 0 16 3V1.8a.8.8 0 0 0-.8-.8z"></path></svg>
            {:else}
                <svg onclick={handleArchiveClick} class="archive" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5zm13-3H1v2h14zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5"></path></svg>
            {/if}
        </div>
    </button>
{/await}

<style>
    button {
        border: none;
        border-radius: 5px;

        display: flex;
        flex-direction: column;
        justify-content: end;

        position: relative;
    }

    .bottomBar {
        display: flex;
        justify-content: center;
        align-items: end;

        border-radius: 0 0 5px 5px;

        margin: 0;

        width: 100%;
        height: 2em;

        padding: 1em 0 5px 0;

        -webkit-mask: -webkit-gradient(
                linear,
                left 35%,
                left 0%,
                from(rgba(0, 0, 0, 1)),
                to(rgba(0, 0, 0, 0))
        );
        background-color: rgba(38, 36, 36, 0.4);
        backdrop-filter: blur(3px);

        transition: 0.4s;
    }

    button:hover .bottomBar {
        backdrop-filter: blur(0);
        background-color: transparent;
    }

    button:hover {
        outline: none;
        box-shadow: 0 0 0 3px var(--accent);
    }

    h2 {
        margin: 0;
        padding: 0 0.5em;
        color: white;
        transition: 0.3s;
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 400;
        white-space: nowrap;
    }

    button:hover h2 {
        color: transparent;
        transform: translateY(100%);
    }

    img {
        height: inherit;
        width: inherit;
        border-radius: inherit;
        position: absolute;
        object-fit: cover;
    }

    .iconsHolder {
        display: flex;
        flex-flow: column wrap;
        justify-content: flex-start;
        position: absolute;
        top: 0.5em;
        right: 0.5em;
        gap: 0.5em;
    }

    .favourite, .favouriteFilled, .archive, .archiveFilled {
        color: transparent;
        height: 1em;
        /* Collapses element's vertical space (height + parent gap) when hidden (color: transparent) */
        /* using negative margins. This avoids having to use 'display: none', which would */
        /* prevent the CSS transitions used for revealing the icon on hover. */
        margin-top: -0.5em;
        margin-bottom: -1em;
        -webkit-filter: drop-shadow(0 0 3px rgba(0, 0, 0, .25));
        transition: 0.4s;
    }

    button:hover .favourite, .favouriteFilled, button:hover .archive, .archiveFilled {
        margin-top: 0;
        margin-bottom: 0;
        color: white;
    }

    .favouriteFilled {
        fill: var(--warning);
    }

    button:hover .favouriteFilled {
        fill: var(--warning);
        -webkit-filter: drop-shadow(0 0 3px rgba(0, 0, 0, .25)) brightness(100%);
    }

    button:hover .favourite:hover {
        color: var(--warning);
    }

    button:hover .favouriteFilled:hover, button:hover .archive:hover, button:hover .archiveFilled:hover {
        -webkit-filter: drop-shadow(0 0 3px rgba(0, 0, 0, .25)) brightness(75%);
    }
</style>