<script lang="ts">
    import {SaveLoadManager} from "../scripts/SaveLoad/SaveLoadManager.js";
</script>

<button on:click={() => console.log(SaveLoadManager.getData().appName)}>Create button</button>