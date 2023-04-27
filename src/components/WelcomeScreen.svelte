<script lang="ts">
    import BoardButton from "./BoardButton.svelte";
    import "../stylesheets/boardButtons.css"

    let boards = ([1, 2, 3, 4, 5]).map(i => {return {title: "board" + i, picture: "https://placekitten.com/512/512"}}); //placeholder
</script>

<div>
    <button class="createButton">%%Create</button>
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
</style>