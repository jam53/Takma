<script lang="ts">
    import {selectedBoardId} from "../../scripts/stores";
    import type {Board} from "../../scripts/Board";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {getImageUrl} from "../../scripts/GetImageUrl";

    const board: Board = SaveLoadManager.getData().getBoard($selectedBoardId);
</script>

<div>
    <h1>Board screen</h1>
</div>
