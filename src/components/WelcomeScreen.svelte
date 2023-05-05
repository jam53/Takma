<script lang="ts">
    import BoardButton from "./BoardButton.svelte";

    let boards = ([1, 2, 3, 4, 5]).map(i => {return {title: "board" + i, picture: "https://placekitten.com/512/512"}}); //placeholder
</script>

<div>
    <button class="createButton boardButtons">%%Create</button>
    <!-- placeholder -->
    {#each boards as board}
        <BoardButton image={board.picture} title={board.title}/>
    {/each}
</div>

<style>
    div {
        display: flex;
        flex-flow: wrap;
    }

    .createButton {
        color: var(--main-text);
        border: 2px dashed #b4b4b4;
    }
    [data-theme='dark'] .createButton {
        border: 2px dashed #4b4b4b;
    }
    .createButton:hover {
        border: 2px solid var(--accent);
        color: var(--accent);
    }

    :global(.boardButtons) {
        background-color: transparent;
        transition-duration: 0.4s;
        border-radius: 5px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 20px;
        cursor: pointer;
        width: 15em;
        height: 8em;
        margin: 1em;
        background-size: cover;
        border: none;
        padding: 0;
    }
    :global(.boardButtons:hover) {
        scale: 105%;
    }
</style>