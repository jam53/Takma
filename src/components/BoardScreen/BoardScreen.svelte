<script lang="ts">
    import {selectedBoardId} from "../../scripts/stores";
    import type {Board} from "../../scripts/Board";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {getImageUrl} from "../../scripts/GetImageUrl";

    const board: Board = SaveLoadManager.getData().getBoard($selectedBoardId);
</script>

<div>
    <h1>Board screen</h1>
    {#await getImageUrl(board.backgroundImageUrl, SaveLoadManager.getSaveDirectory())}
        <p>%%Loading...</p>
    {:then bgImg}
        <img src={bgImg} style="max-height: 80vh; max-width: 100vw"/>
    {/await}
</div>
