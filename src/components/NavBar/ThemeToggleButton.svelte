<script lang="ts">
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {I18n} from "../../scripts/I18n/I18n";

    export let saveLocationSet: boolean;

    let darkTheme = saveLocationSet ? SaveLoadManager.getData().darkTheme : true; //We create an extra variable, rather than using `SaveLoadManager.getData().darkTheme`. Because otherwise the UI of the toggle/button wouldn't update, because Svelte wouldn't know that the state changed
    document.documentElement.setAttribute("data-theme", darkTheme ? "dark" : "light"); //This sets the value of the "data-theme" attribute in our html. The values of the color variables we defined in our CSS will be set based on the value of this attribute.
    //https://lukelowrey.com/css-variable-theme-switcher/
    document.documentElement.style.setProperty("color-scheme", darkTheme ? "dark" : "light"); //This sets the color theme of the html. We might overwrite certain styleclasses/colors etc. But at least this way some stuff will already be in a white/dark theme depending on the selected color-scheme. For example the background color of the page, buttons, scrollbars etc will be changed depending on the color-scheme property's value

    function toggleTheme()
    {
        darkTheme = !darkTheme;
        document.documentElement.setAttribute("data-theme", darkTheme ? "dark" : "light");
        document.documentElement.style.setProperty("color-scheme", darkTheme ? "dark" : "light");
        SaveLoadManager.getData().darkTheme = darkTheme;
    }

</script>

{#if saveLocationSet}
<!-- We only render the color theme toggle if a save location is already set. If the save location is not set it means we are on the ChooseSaveLocationScreen, at that point we don't want the user to adjust the color theme, so we hide this toggle. You may wonder why we do the {#if} check here in the component itself and not in NavBar.svelte like with all the other buttons in the navbar. That's because if we put the {#if} around this toggle in NavBar.svelte, this component wouldn't be displayed when there is no save location. But in that case, the code in this component would also not be executed. Doing it this way the UI is also not displayed, but the code in the <script> block still gets executed. This is important because otherwise we would encounter issues when accessing colors in CSS via var(--variableName).-->

    <div on:click={() => toggleTheme()} class="tdnn" class:day={!darkTheme} title={I18n.t("toggleColorTheme")}>
        <div class="moon" class:sun={!darkTheme}></div>
    <!--  The syntax `class:cssClass={booleanVar}` only applies/adds the css class if the `booleanVar` is true  -->
    </div>
{/if}

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
        /*change size of toggle with font-size*/
        font-size: 13%;
        position: relative;
        height: var(--toggleHeight);
        width: var(--toggleWidth);
        border-radius: var(--toggleHeight);
        transition: all 500ms ease-in-out;
        background: var(--bgColor--night);
        -webkit-filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, .35));
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