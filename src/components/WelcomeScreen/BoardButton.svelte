<script lang="ts">
    import {getImageUrl} from "../../scripts/GetImageUrl";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {createEventDispatcher} from "svelte";

    export let image: string;
    export let title: string;


    const dispatch = createEventDispatcher(); //Deze createEventDispatcher en de passClickEventToParent stukken code worden gebruikt om het on click event door te geven naar de parent. Die kan wnr er geklikt is dat opvangen door on:clicked={...} te doen
    function passClickEventToParent()
    {
        dispatch("clicked");
    }
</script>

{#await getImageUrl(image, SaveLoadManager.getSaveDirectory())}
    <p>%%Loading...</p>
{:then imgSrc}
    <button on:click={passClickEventToParent} class="boardButtons">
        <img src={imgSrc}/>
        <div class="bottomBar">
            <h2>
                {title}
            </h2>
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
</style>