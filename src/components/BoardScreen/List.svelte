<script lang="ts">
    import {slide} from "svelte/transition";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import type {List} from "../../scripts/Board";
    import {selectedBoardId} from "../../scripts/stores";

    export let listId: string;
    export let inTransitionDelay: number;

    const list:List = SaveLoadManager.getData().getList($selectedBoardId, listId);

    /**
     * After we created a new list, this function will be called to scroll to the `createNewList` component, so that it is visible on screen again since it will be pushed to the side by the new list that was just created.
     * If there aren't that many lists, and the `createNewList` component is still visible on the screen. The function will still be called however we won't see anything change visually, since .scrollIntoView() won't do anything because the `createNewList` component is still visible.
     *
     * We call this function when the intro animation of each list starts. If we would call the scrollIntoView() function to early, we wouldn't scroll since the UI wouldn't have refreshed yet to show the new list and the `createNewList` component would still be on screen. It might not be ideal but I figured out that `on:introstart` gets fired once this component is visible on screen. So we we can use `on:introstart` to execute this scrollIntoView() function.
     * However, if we don't check whether or not the `createNewList` component contains the `newListCreating` styleclass. We would also scroll to the `createNewList` when we just open a board. We don't want that, we only want to scroll to the `createNewList` component if we are adding new lists. This is the case when the `newListCreating` styleclass is applied to the `createNewList` component, hence the if that checks whether or not this styleclass is applied.
     */
    function scrollToCreateNewListDiv()
    {
        let createNewListDiv = document.getElementById("createNewListDiv");

        if (createNewListDiv.classList.contains("newListCreating"))
        {
            createNewListDiv.scrollIntoView({ behavior: "smooth"});
        }
    }

</script>

<div class="list" in:slide={{delay: inTransitionDelay*100}} on:introstart={scrollToCreateNewListDiv}>
    <span style="word-wrap: break-word">
        {list.title}
    </span>
</div>

<style>
    .list {
        background-color: rgba(var(--background-color-rgb-values), 0.2);
        backdrop-filter: blur(10px);
        border-radius: 4px;
        padding: 0.75em 0.5em;
        transition: 0.4s;
        color: var(--main-text);
        width: 16em;
        border: 1px solid rgba(var(--background-color-rgb-values), 0.4);
    }
</style>