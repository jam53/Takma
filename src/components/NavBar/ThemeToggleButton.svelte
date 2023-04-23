<script lang="ts">
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";

    let darkTheme = SaveLoadManager.getData().darkTheme; //We create an extra variable, rather than using `SaveLoadManager.getData().darkTheme`. Because otherwise the UI of the toggle/button wouldn't update, because Svelte wouldn't know that the state changed
    darkTheme && window.document.body.classList.add("darkTheme"); //Only add the darkTheme css class when the `darkTheme` variable is true

    function toggleTheme()
    {
        darkTheme = !darkTheme;
        window.document.body.classList.toggle("darkTheme");
        SaveLoadManager.getData().darkTheme = darkTheme;
    }

</script>

<div on:click={() => toggleTheme()} class="tdnn" class:day={!darkTheme}>
    <div class="moon" class:sun={!darkTheme}></div>
<!--  The syntax `class:cssClass={booleanVar}` only applies/adds the css class if the `booleanVar` is true  -->
</div>

<style>
    :root {
        --darkbg: #251d29;
        --darkt: #ffd1f7;
        --lightbg: #fff;
        --lightt: #d43370;

        --toggleHeight: 16em;
        --toggleWidth: 30em;
        --toggleBtnRadius: 10em;

        --bgColor--night: #423966;
        --mooncolor: #d9fbff;
        --bgColor--day: #9ee3fb;
    }
    .tdnn {
        cursor: pointer;
        margin: 0 auto;
        /*change size of toggle with font-size*/
        font-size: 15%;
        position: relative;
        height: var(--toggleHeight);
        width: var(--toggleWidth);
        border-radius: var(--toggleHeight);
        transition: all 500ms ease-in-out;
        background: var(--bgColor--night);
    }
    .day {
        background: #ffbf71;
    }
    .moon {
        position: absolute;
        display: block;
        border-radius: 50%;
        transition: all 400ms ease-in-out;
        top: 3em;
        left: 3em;
        transform: rotate(-75deg);
        width: var(--toggleBtnRadius);
        height: var(--toggleBtnRadius);
        background: var(--bgColor--night);
        box-shadow: 3em 2.5em 0 0em var(--mooncolor) inset,
        rgba(255, 255, 255, 0.1) 0em -7em 0 -4.5em,
        rgba(255, 255, 255, 0.1) 3em 7em 0 -4.5em,
        rgba(255, 255, 255, 0.1) 2em 13em 0 -4em,
        rgba(255, 255, 255, 0.1) 6em 2em 0 -4.1em,
        rgba(255, 255, 255, 0.1) 8em 8em 0 -4.5em,
        rgba(255, 255, 255, 0.1) 6em 13em 0 -4.5em,
        rgba(255, 255, 255, 0.1) -4em 7em 0 -4.5em,
        rgba(255, 255, 255, 0.1) -1em 10em 0 -4.5em;
    }
    .sun {
        top: 4.5em;
        left: 18em;
        transform: rotate(0deg);
        width: 7em;
        height: 7em;
        background: #fff;
        box-shadow: 3em 3em 0 5em #fff inset, 0 -5em 0 -2.7em #fff,
        3.5em -3.5em 0 -3em #fff, 5em 0 0 -2.7em #fff, 3.5em 3.5em 0 -3em #fff,
        0 5em 0 -2.7em #fff, -3.5em 3.5em 0 -3em #fff, -5em 0 0 -2.7em #fff,
        -3.5em -3.5em 0 -3em #fff;
    }
</style>