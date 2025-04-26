<script lang="ts">
    import {I18n} from "../../../scripts/I18n/I18n";
    import {readText, writeText} from "@tauri-apps/plugin-clipboard-manager";
    import {toast} from "svelte-sonner";
    import type {Editor} from "@tiptap/core";

    interface Props {
        cardDescription: string;
        tiptapEditor?: Editor;
        otherEditorName: string,
        switchToOtherTextEditor: () => void;
    }

    let {
        cardDescription,
        tiptapEditor,
        otherEditorName,
        switchToOtherTextEditor,
    }: Props = $props();
</script>

<div class="copyEditButtons">
    <button onclick={switchToOtherTextEditor} title={otherEditorName}>
        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
        {otherEditorName}
    </button>
    <button onclick={async () => {
            await writeText(cardDescription);

            let textInClipboard = await readText();
            if (textInClipboard === cardDescription)
            {
                toast(I18n.t("copiedCardDescriptionToClipboard"));
            }
            else
            {
                toast.error(I18n.t("failedToCopyToClipboard"));
            }
        }} title={I18n.t("copyMarkdown")}>
        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"><path d="M593.8 59.1H46.2C20.7 59.1 0 79.8 0 105.2v301.5c0 25.5 20.7 46.2 46.2 46.2h547.7c25.5 0 46.2-20.7 46.1-46.1V105.2c0-25.4-20.7-46.1-46.2-46.1zM338.5 360.6H277v-120l-61.5 76.9-61.5-76.9v120H92.3V151.4h61.5l61.5 76.9 61.5-76.9h61.5v209.2zm135.3 3.1L381.5 256H443V151.4h61.5V256H566z"></path></svg>
        {I18n.t("copyMarkdown")}
    </button>
    {#if tiptapEditor}
        <button onclick={async () => {
                const plainTextCardDescription = tiptapEditor?.getText();
                await writeText(plainTextCardDescription ?? "");

                let textInClipboard = await readText();
                if (textInClipboard === plainTextCardDescription)
                {
                    toast(I18n.t("copiedCardDescriptionToClipboard"));
                }
                else
                {
                    toast.error(I18n.t("failedToCopyToClipboard"));
                }
            }} title={I18n.t("copyText")}>
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><path d="M154.31,156.92,137.83,180l16.53,23.14a8.18,8.18,0,0,1-1.22,11,8,8,0,0,1-11.65-1.48L128,193.76l-13.49,18.89a8,8,0,0,1-11.64,1.49,8.17,8.17,0,0,1-1.23-11L118.17,180l-16.48-23.08a8.22,8.22,0,0,1,1.46-11.28,8,8,0,0,1,11.36,1.71L128,166.24l13.49-18.89a8,8,0,0,1,11.36-1.71A8.22,8.22,0,0,1,154.31,156.92ZM84,144H44.27A8.18,8.18,0,0,0,36,151.47,8,8,0,0,0,44,160H56v47.73A8.17,8.17,0,0,0,63.47,216,8,8,0,0,0,72,208V160H83.73A8.18,8.18,0,0,0,92,152.53,8,8,0,0,0,84,144Zm128,0H172.27a8.18,8.18,0,0,0-8.25,7.47,8,8,0,0,0,8,8.53h12v47.73a8.17,8.17,0,0,0,7.47,8.25,8,8,0,0,0,8.53-8V160h11.73a8.18,8.18,0,0,0,8.25-7.47A8,8,0,0,0,212,144ZM40,116V40A16,16,0,0,1,56,24h96a8,8,0,0,1,5.66,2.34l56,56A8,8,0,0,1,216,88v28a4,4,0,0,1-4,4H44A4,4,0,0,1,40,116ZM152,88h44L152,44Z"></path></svg>
            {I18n.t("copyText")}
        </button>
    {/if}
</div>

<style>
    .copyEditButtons {
        display: flex;
        gap: 0.5em;
    }

    .copyEditButtons button {
        display: flex;
        background-color: var(--border);
        border-radius: 4px;
        border: none;
        align-items: center;
        gap: 0.5em;
        cursor: pointer;
        transition: 0.3s;
        min-height: 2em;
        font-size: medium;
        width: 100%;
        justify-content: center;
        margin: 0.5em 0;
    }

    .copyEditButtons button:hover {
        background-color: var(--unselected-button);
    }

    .copyEditButtons button svg {
        min-width: 1.5em;
        height: 1.5em;
    }
</style>