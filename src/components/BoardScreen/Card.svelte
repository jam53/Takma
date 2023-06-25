<script lang="ts">
    export let id;
</script>

<div class="cardContainer" on:click={() => alert("card clicked")}>
    <h3>
        {id}
    </h3>
</div>

<style>
    .cardContainer {
        cursor: pointer;
        border: 1px red solid;
    }
</style>