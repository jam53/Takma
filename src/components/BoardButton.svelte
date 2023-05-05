<script lang="ts">
    export let image: string;
    export let title: string;
</script>

<button style="background-image: url({image});">
    <div class="bottomBar">
        <h2>
            {title}
        </h2>
    </div>
</button>

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
    }

    button:hover h2 {
        color: transparent;
        transform: translateY(100%);
    }
</style>