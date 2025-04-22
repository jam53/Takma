<script lang="ts">
    import {onDestroy, onMount} from 'svelte';
    import {Editor, markInputRule} from '@tiptap/core';
    import StarterKit from '@tiptap/starter-kit';
    import {BubbleMenu} from "@tiptap/extension-bubble-menu";
    import Bold from '@tiptap/extension-bold';
    import {Markdown} from "tiptap-markdown";
    import {CodeBlockLowlight} from "@tiptap/extension-code-block-lowlight";
    import {all, createLowlight} from "lowlight";
    import {TaskItem} from "@tiptap/extension-task-item";
    import {TaskList} from "@tiptap/extension-task-list";
    import {TableCell} from "@tiptap/extension-table-cell";
    import {Table} from "@tiptap/extension-table";
    import {TableRow} from "@tiptap/extension-table-row";
    import {TableHeader} from "@tiptap/extension-table-header";
    import {FloatingMenu} from "@tiptap/extension-floating-menu";
    import {Link} from "@tiptap/extension-link";
    import {selectedBoardId} from "../../../scripts/Stores.svelte.js";
    import {I18n} from "../../../scripts/I18n/I18n";
    import {open as openDialog} from "@tauri-apps/plugin-dialog";
    import {TakmaLinkExtensionSvelte} from "../../../scripts/Tiptap/TakmaLinkExtension.svelte";
    import {Underline} from "@tiptap/extension-underline";
    import {TextStyle} from "@tiptap/extension-text-style";
    import {Color} from "@tiptap/extension-color";
    import {Image} from "@tiptap/extension-image";
    import {FileHandler} from "../../../scripts/Tiptap/FileHandler";
    import {
        imageExtensions,
        saveAbsoluteFilePathToSaveDirectory,
        saveFileToSaveDirectory
    } from "../../../scripts/TakmaDataFolderIO";
    import {DetailsContent} from "../../../scripts/Tiptap/DetailsContent";
    import {DetailsSummary} from "../../../scripts/Tiptap/DetailsSummary";
    import {Details} from "../../../scripts/Tiptap/Details";
    import {toast} from "svelte-sonner";
    import {readText, writeText} from "@tauri-apps/plugin-clipboard-manager";
    import {Placeholder} from "@tiptap/extension-placeholder";
    import {openUrl} from "@tauri-apps/plugin-opener";

    interface Props {
        cardDescription: string;
        getImageUrl: (imageSrc: string) => string;
        switchToPlainTextEditor: () => void;
    }

    let {
        cardDescription = $bindable(),
        getImageUrl,
        switchToPlainTextEditor,
    }: Props = $props();

    let editorElement: HTMLDivElement;
    let bubbleMenuElement: HTMLDivElement;
    let floatingMenuElement: HTMLDivElement;
    let editor: Editor | null = $state(null);

    let isTableActive = $state(false);
    let isLinkActive = $state(false);
    let isSelectionEmpty = $state(false);
    let isHeading = $state(false);
    let isTextStyle = $state(false);

    onMount(() => {
        if (!bubbleMenuElement || !floatingMenuElement)
        {
            console.error("Menu elements not found on mount!");
            return;
        }

        editor = new Editor({
            element: editorElement,
            content: cardDescription,
            editorProps: {
                handleClickOn(view, pos, node, nodePos, event, direct) {
                    const targetElement = event.target as HTMLElement;

                    // Handle LMB clicks on regular http/https links using Tauri's `openUrl()` to ensure it opens in the user's default browser rather than in a new Tauri window
                    if(event.button === 0 && targetElement.tagName === 'A' && targetElement.hasAttribute('href'))
                    {
                        event.preventDefault();
                        event.stopPropagation();
                        openUrl(targetElement.getAttribute('href')!);
                        return true; // Signals that the "click" was handled
                    }

                    return false; // Let Tiptap handle other clicks
                },
            },
            extensions: [
                StarterKit.configure({
                    codeBlock: false,
                    bold: false,
                }),
                // Bubble menu, display above selected text or when in a table
                BubbleMenu.configure({
                    element: bubbleMenuElement,
                    tippyOptions: {
                        duration: 100,
                        placement: 'top-start',
                    },
                    shouldShow: ({ editor, state }) => {
                        const { selection } = state;
                        const { $from: from, empty } = selection;
                        // Show if text is selected OR if the cursor is inside a table
                        return editor.isEditable && (!empty || editor.isActive('table'));
                    }
                }),
                // Floating menu, for actions on empty lines
                FloatingMenu.configure({
                    element: floatingMenuElement,
                    tippyOptions: { duration: 100, placement: 'left-start' },
                    shouldShow: ({ editor, state }) => {
                        const { selection } = state;
                        const { $from: from, empty } = selection;

                        return (
                            editor.isEditable &&
                            empty &&
                            from.parent.isTextblock && // Is the immediate container a text block?
                            from.parent.content.size === 0 && // Is it empty?
                            !editor.isActive('table')
                        );
                    },
                }),
                Markdown.configure({
                    html: true, // Allow HTML input/output
                    tightLists: true, // No <p> inside <li> in markdown output
                    tightListClass: 'tight', // Add class to <ul> allowing you to remove <p> margins when tight
                    bulletListMarker: '-', // <li> prefix in markdown output
                    linkify: true, // Create links from "https://..." text
                    breaks: false, // Whether or not new lines (\n) in markdown input are converted to <br>
                    transformPastedText: true, // Allow to paste Markdown text in the editor
                    transformCopiedText: false, // Whether or not copied text is transformed to Markdown
                }),
                CodeBlockLowlight.configure({
                    exitOnTripleEnter: false,
                    lowlight: createLowlight(all),
                }).extend({
                    addKeyboardShortcuts() {
                        return {
                            Tab: () => {
                                // Insert spaces when hitting the tab key while in a code block, rather than selecting/jumping to the next element in the DOM
                                if (editor?.isActive("codeBlock"))
                                {
                                    const { state, dispatch } = this.editor.view;
                                    const { from, to } = state.selection;

                                    dispatch(state.tr.insertText('    ', from, to));
                                    return true;
                                }
                                return false;
                            },
                        }
                    },
                }),
                TaskList,
                TaskItem.configure({
                    nested: true
                }),
                Table,
                TableRow,
                TableHeader,
                TableCell,
                TakmaLinkExtensionSvelte,
                Link.configure({
                    openOnClick: true, // Opens link when clicking in editor
                    autolink: true, // If enabled, adds links as you type
                    linkOnPaste: true, // Adds a link to the current selection if the pasted content only contains an url
                }).extend({
                    addKeyboardShortcuts() {
                        return {
                            'Mod-k': () => {
                                setLink();
                                return true;
                            },
                        }
                    },
                    renderHTML({HTMLAttributes}) {
                        return ['a', {...HTMLAttributes, title: HTMLAttributes.href}]
                    },
                }),
                Bold.extend({
                    addInputRules() {
                        return [
                            markInputRule({
                                // Regex for matching `** **`. Explicitly not matching `__ __` for bold, which is the default behaviour. However, since we defined `__ __` as the syntax for underlining we ensure that we don't match `__ __` for bold
                                find: /(?:^|\s)(\*\*(?!\s+\*\*)((?:[^*]+))\*\*(?!\s+\*\*))$/,
                                type: this.type,
                            }),
                        ];
                    },
                }),
                Underline.extend({
                    // Add input rule for `__ __`
                    addInputRules() {
                        return [
                            markInputRule({
                                // Regex to match `__ __`
                                find: /(?:^|\s)(__(?!\s+__)((?:[^_]+))__(?!\s+__))$/,
                                type: this.type,
                            }),
                        ];
                    },
                }),
                TextStyle, // Needs to be added before the Color extension
                Color,
                Image.configure({
                    inline: true,
                    allowBase64: true,
                }).extend({
                    renderHTML({HTMLAttributes})
                    {
                        return ['img', {src: getImageUrl(decodeURIComponent(HTMLAttributes.src))}]
                    }
                }),
                FileHandler.configure({
                    onPaste: (currentEditor, files, htmlContent) => {
                        files.forEach(async file => {
                            // If there is htmlContent, stop manual insertion and let other extensions handle insertion via inputRule
                            if (htmlContent)
                            {
                                return false
                            }

                            currentEditor.chain().insertContentAt(currentEditor.state.selection.anchor, {
                                type: 'image',
                                attrs: {
                                    src: (await saveFileToSaveDirectory(file, selectedBoardId.value)).replace(/\\/g, '/') // Ensure the file path uses forward slashes for Markdown image links, converting any backslashes from Windows file paths
                                },
                            }).focus().run()
                        })
                    },
                }),
                Details.configure({
                    persist: true,
                    HTMLAttributes: {
                        class: 'details',
                    },
                }),
                DetailsContent,
                DetailsSummary,
                Placeholder.configure({
                    placeholder: I18n.t("addDetailedDescriptionMarkdown"),
                }),
            ],
            onTransaction: () => {
                isTableActive = editor?.isActive('table') ?? false;
                isLinkActive = editor?.isActive('link') ?? false;
                isSelectionEmpty = editor?.state.selection.empty ?? false;
                isHeading = editor?.isActive('heading') ?? false;
                isTextStyle = editor?.isActive('textStyle') ?? false;
            },
            onCreate: ({ editor }) => {
                editor.view.dom.setAttribute("spellcheck", "false");

                // This code solves the problem where custom "takma://" links aren't recognized as links when the editor is initially loaded. Causing them to be displayed as a plain text string, rather than being displayed as the TakmaLink.svelte component. We solve this by parsing any Takma links and wrapping them with angle brackets, which will allow Tiptap's Markdown processor to recognize the Takma links as actual links.

                // Regex to find takma:// links that are not already inside angle brackets (<...>)
                // - (?<!<) : Negative lookbehind assertion. Ensures the match doesn't start immediately after '<'.
                //             This prevents modifying links that are already formatted as autolinks.
                // - (takma:\/\/[\w-]+(?:\/[\w-]+)?) : Capturing group 1. Matches and captures the actual Takma link string.
                const takmaRegex = /(?<!<)(takma:\/\/[\w-]+(?:\/[\w-]+)?)/g;

                let markdownContent = editor.storage.markdown.getMarkdown();

                // Replace plain "takma://..." strings with the Markdown autolink format "<takma://...>"
                markdownContent = markdownContent.replace(takmaRegex, (match, p1_link) => {
                    // Angle brackets `<...>` around a URL (like `<https://google.com>` or `<takma://board/card>`)
                    // represent the Markdown autolink syntax.
                    // By wrapping the plain `takma://` string in these brackets, we are formatting it
                    // in a way that Markdown parsers (like the one used by tiptap-markdown with the `linkify: true` option)
                    // are supposed to recognize as a link during the Markdown-to-HTML conversion phase.
                    // The goal is that the Markdown parser will then convert `<takma://...>`
                    // into an HTML anchor tag (`<a href="takma://...">...</a>`). This intermediate HTML tag can then
                    // be correctly interpreted by your `TakmaLink` extension's `parseHTML` rule
                    // during Tiptap's subsequent internal HTML parsing phase, allowing the creation of the desired custom TakmaLink.svelte node.
                    return `<${p1_link}>`; // Return the link wrapped in angle brackets.
                });

                // Replace the editor's content entirely with the modified Markdown string.
                // This forces Tiptap and tiptap-markdown to re-parse the content from scratch,
                // now recognizing the `<takma://...>` autolinks we just created.
                editor.commands.setContent(markdownContent);
            },
            onUpdate: ({editor}) => {
                cardDescription = editor.storage.markdown.getMarkdown();
            },
        });
    });

    onDestroy(() => {
        if (editor)
        {
            editor.destroy();
            editor = null;
        }
    });

    const runCommand = (command: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) => {
        if (editor)
        {
            command(editor.chain().focus()).run();
        }
    }

    const setLink = () => {
        // Get the current URL if we are editing an existing link
        const previousUrl = editor?.getAttributes('link').href || "";

        const url = window.prompt(I18n.t("urlOfLink"), previousUrl);

        // If the user cancelled the prompt
        if (url === null)
        {
            return;
        }

        // If the user cleared the input i.e. wants to remove the link
        if (url === "")
        {
            editor?.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }

    /**
     * Adjusts the heading level of the Tiptap node at the current cursor position.
     *
     * - If the node at the cursor is already a heading:
     *   - Calculates a new heading level by subtracting the `value` from the current level.
     *   - A positive `value` *decreases* the heading level number (e.g., H3 becomes H2 if value is 1), therefore *increasing* the size of the heading.
     *   - A negative `value` *increases* the heading level number (e.g., H2 becomes H3 if value is -1), therefore *decreasing* the size of the heading.
     *   - The resulting level is clamped between 1 and 6 (inclusive).
     * - If the node at the cursor is not a heading (e.g., a paragraph):
     *   - Converts the node to a level 1 heading, ignoring the `value` parameter.
     *
     * @param value The amount to adjust the heading level by. Positive decreases level number (increasing the size of the heading), negative increases level number (decreasing the size of the heading).
     */
    function adjustHeading(value: number)
    {
        runCommand(chain =>
            chain.command(({ state, commands }) => {
                const { $from: from } = state.selection
                const node = from.node()

                if (node.type.name === "heading")
                {
                    const currentLevel = node.attrs.level;
                    const newLevel = Math.max(Math.min(currentLevel - value, 6), 1);
                    return commands.setNode("heading", {level: newLevel});
                }
                // If it's not a heading yet, make the line a heading
                else
                {
                    return commands.setNode("heading", { level: 1 });
                }
            })
        )
    }

    /**
     * Handles inserting an image into the Tiptap editor by prompting the user for a URL that points to an image
     */
    function handleInsertImageUrl()
    {
        const imgUrl = window.prompt(I18n.t("urlOfImage"));

        if (imgUrl)
        {
            runCommand(chain => chain.setImage({src: imgUrl}));
        }
    }

    /**
     * Handles inserting an image into the Tiptap editor by showing a file picker to select an image file from disk
     */
    async function handleInsertImageFile()
    {
        const selected = await openDialog({
            multiple: false,
            filters: [{
                name: I18n.t("image"),
                extensions: imageExtensions
            }]
        });

        if (selected !== null && typeof(selected) === "string")
        {
            let imgUrl = (await saveAbsoluteFilePathToSaveDirectory(selected, selectedBoardId.value)).replace(/\\/g, '/') // Ensure the file path uses forward slashes for Markdown image links, converting any backslashes from Windows file paths
            runCommand(chain => chain.setImage({src: imgUrl}));
        }
    }
</script>

<!-- Tiptap text editor component -->
<div bind:this={editorElement} class="editor-content" />

<!-- Buttons to switch to the plain text editor, copy the description as Markdown or to copy the description as plain text -->
{#if cardDescription}
    <div class="copyEditButtons">
        <button onclick={switchToPlainTextEditor} title={I18n.t("plainTextEditor")}>
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0z"></path><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
            {I18n.t("plainTextEditor")}
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
        <button onclick={async () => {
            const plainTextCardDescription = editor?.getText();
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
    </div>
{/if}

<!-- Floating Menu -->
<!-- Shown on empty lines -->
<div bind:this={floatingMenuElement} class="floating-menu">
    {#if editor}
        {#if !isHeading}
            <button
                    onclick={() => runCommand(chain => chain.toggleHeading({ level: 1 }))}
                    class:active={editor.isActive('heading', { level: 1 })}
                    class="menu-button"
                        title={I18n.t("heading")}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M0 64C0 46.3 14.3 32 32 32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 112 224 0 0-112-16 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 144 0 176 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-144-224 0 0 144 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-176L48 96 32 96C14.3 96 0 81.7 0 64z"></path></svg>
            </button>
        {:else}
            <button
                    onclick={() => runCommand(chain => chain.toggleHeading({ level: 1 }))}
                    class:active={editor.isActive('heading', { level: 1 })}
                    class="menu-button"
                    title={I18n.t("heading")}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M0 64C0 46.3 14.3 32 32 32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 112 224 0 0-112-16 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 144 0 176 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-144-224 0 0 144 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-176L48 96 32 96C14.3 96 0 81.7 0 64z"></path></svg>
            </button>
            <button
                    onclick={() => adjustHeading(1)}
                    class:active={editor.isActive('heading', { level: 1 })}
                    class="menu-button"
                    title={I18n.t("smallerHeading")}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M0 64C0 46.3 14.3 32 32 32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 112 224 0 0-112-16 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 144 0 176 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-144-224 0 0 144 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-176L48 96 32 96C14.3 96 0 81.7 0 64z"></path></svg>+
            </button>
            <button
                    onclick={() => adjustHeading(-1)}
                    class:active={editor.isActive('heading', { level: 1 })}
                    class="menu-button"
                    title={I18n.t("biggerHeading")}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M0 64C0 46.3 14.3 32 32 32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 112 224 0 0-112-16 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 144 0 176 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-144-224 0 0 144 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-176L48 96 32 96C14.3 96 0 81.7 0 64z"></path></svg>-
            </button>
        {/if}

        <button
                onclick={() => runCommand(chain => chain.toggleCodeBlock())}
                class="menu-button"
                title={I18n.t("codeBlock")}
        >
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"><path d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z"></path></svg>
        </button>
        <button
                onclick={() => runCommand(chain => chain.toggleBlockquote())}
                class="menu-button"
                title={I18n.t("quote")}
        >
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M0 216C0 149.7 53.7 96 120 96l8 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-8 0c-30.9 0-56 25.1-56 56l0 8 64 0c35.3 0 64 28.7 64 64l0 64c0 35.3-28.7 64-64 64l-64 0c-35.3 0-64-28.7-64-64l0-32 0-32 0-72zm256 0c0-66.3 53.7-120 120-120l8 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-8 0c-30.9 0-56 25.1-56 56l0 8 64 0c35.3 0 64 28.7 64 64l0 64c0 35.3-28.7 64-64 64l-64 0c-35.3 0-64-28.7-64-64l0-32 0-32 0-72z"></path></svg>
        </button>
        <button
                onclick={() => runCommand(chain => chain.toggleBulletList())}
                class="menu-button"
                title={`${I18n.t("genericList")} (Ctrl + Shift + 8)`}
        >
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M40 48C26.7 48 16 58.7 16 72l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24L40 48zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L192 64zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zM16 232l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0c-13.3 0-24 10.7-24 24zM40 368c-13.3 0-24 10.7-24 24l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0z"></path></svg>
        </button>
        <button
                onclick={() => runCommand(chain => chain.toggleOrderedList())}
                class="menu-button"
                title={`${I18n.t("numberedList")}  (Ctrl + Shift + 7)`}
        >
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M61.77 401l17.5-20.15a19.92 19.92 0 0 0 5.07-14.19v-3.31C84.34 356 80.5 352 73 352H16a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8h22.83a157.41 157.41 0 0 0-11 12.31l-5.61 7c-4 5.07-5.25 10.13-2.8 14.88l1.05 1.93c3 5.76 6.29 7.88 12.25 7.88h4.73c10.33 0 15.94 2.44 15.94 9.09 0 4.72-4.2 8.22-14.36 8.22a41.54 41.54 0 0 1-15.47-3.12c-6.49-3.88-11.74-3.5-15.6 3.12l-5.59 9.31c-3.72 6.13-3.19 11.72 2.63 15.94 7.71 4.69 20.38 9.44 37 9.44 34.16 0 48.5-22.75 48.5-44.12-.03-14.38-9.12-29.76-28.73-34.88zM496 224H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm0-160H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16zm0 320H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zM16 160h64a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8H64V40a8 8 0 0 0-8-8H32a8 8 0 0 0-7.14 4.42l-8 16A8 8 0 0 0 24 64h8v64H16a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8zm-3.91 160H80a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8H41.32c3.29-10.29 48.34-18.68 48.34-56.44 0-29.06-25-39.56-44.47-39.56-21.36 0-33.8 10-40.46 18.75-4.37 5.59-3 10.84 2.8 15.37l8.58 6.88c5.61 4.56 11 2.47 16.12-2.44a13.44 13.44 0 0 1 9.46-3.84c3.33 0 9.28 1.56 9.28 8.75C51 248.19 0 257.31 0 304.59v4C0 316 5.08 320 12.09 320z"></path></svg>
        </button>
        <button
                onclick={() => runCommand(chain => chain.setHorizontalRule())}
                class="menu-button"
                title={I18n.t("insertHorizontalLine")}
        >
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2 12.75a.75.75 0 0 1 .75-.75h18.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"></path></svg>
        </button>
        <button
                onclick={handleInsertImageUrl}
                class="menu-button"
                title={I18n.t("setImageUsingUrl")}
        >
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6l96 0 32 0 208 0c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z"></path></svg>
        </button>
        <button
                onclick={handleInsertImageFile}
                class="menu-button"
                title={I18n.t("setImageUsingFile")}
        >
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg"><path d="M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-288-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0zM64 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm152 32c5.3 0 10.2 2.6 13.2 6.9l88 128c3.4 4.9 3.7 11.3 1 16.5s-8.2 8.6-14.2 8.6l-88 0-40 0-48 0-48 0c-5.8 0-11.1-3.1-13.9-8.1s-2.8-11.2 .2-16.1l48-80c2.9-4.8 8.1-7.8 13.7-7.8s10.8 2.9 13.7 7.8l12.8 21.4 48.3-70.2c3-4.3 7.9-6.9 13.2-6.9z"></path></svg>
        </button>
        <button
                onclick={() => runCommand(chain => chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }))}
                class="menu-button"
                title={I18n.t("insertTable")}
        >
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M64 256l0-96 160 0 0 96L64 256zm0 64l160 0 0 96L64 416l0-96zm224 96l0-96 160 0 0 96-160 0zM448 256l-160 0 0-96 160 0 0 96zM64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32z"></path></svg>
        </button>
        <button onclick={() => runCommand(chain => chain.setDetails())}
                class="menu-button"
                title={I18n.t("collapsibleSection")}
        >
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 3.5L9 8.49955L4 13.5V3.5ZM21 19.9995V17.9995H3V19.9995H21ZM21 12.9995V10.9995H12V12.9995H21ZM21 5.99951V3.99951H12V5.99951H21Z"></path></svg>
        </button>
    {/if}
</div>

<!-- Bubble Menu -->
<!-- Shown on text selection or when within a table -->
<div bind:this={bubbleMenuElement} class="bubble-menu">
    {#if editor}
        {#if !isSelectionEmpty}
            <button
                    onclick={() => runCommand(chain => chain.toggleBold())}
                    class:active={editor.isActive('bold')}
                    class="menu-button"
                    title={`${I18n.t("bold")} (Ctrl + B)`}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg"><path d="M0 64C0 46.3 14.3 32 32 32l48 0 16 0 128 0c70.7 0 128 57.3 128 128c0 31.3-11.3 60.1-30 82.3c37.1 22.4 62 63.1 62 109.7c0 70.7-57.3 128-128 128L96 480l-16 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-160L48 96 32 96C14.3 96 0 81.7 0 64zM224 224c35.3 0 64-28.7 64-64s-28.7-64-64-64L112 96l0 128 112 0zM112 288l0 128 144 0c35.3 0 64-28.7 64-64s-28.7-64-64-64l-32 0-112 0z"></path></svg>
            </button>
            <button
                    onclick={() => runCommand(chain => chain.toggleItalic())}
                    class:active={editor.isActive('italic')}
                    class="menu-button"
                    title={`${I18n.t("italic")} (Ctrl + I)`}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg"><path d="M128 64c0-17.7 14.3-32 32-32l192 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-58.7 0L160 416l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 480c-17.7 0-32-14.3-32-32s14.3-32 32-32l58.7 0L224 96l-64 0c-17.7 0-32-14.3-32-32z"></path></svg>
            </button>
            <button
                    onclick={() => runCommand(chain => chain.toggleUnderline())}
                    class:active={editor.isActive('underline')}
                    class="menu-button"
                    title={`${I18n.t("underline")} (Ctrl+U)`}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M16 64c0-17.7 14.3-32 32-32l96 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 128c0 53 43 96 96 96s96-43 96-96l0-128-16 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l96 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 128c0 88.4-71.6 160-160 160s-160-71.6-160-160L64 96 48 96C30.3 96 16 81.7 16 64zM0 448c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 480c-17.7 0-32-14.3-32-32z"></path></svg>
            </button>
            <button
                    onclick={() => runCommand(chain => chain.toggleStrike())}
                    class:active={editor.isActive('strikethrough')}
                    class="menu-button"
                    title={I18n.t("strikethrough")}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M161.3 144c3.2-17.2 14-30.1 33.7-38.6c21.1-9 51.8-12.3 88.6-6.5c11.9 1.9 48.8 9.1 60.1 12c17.1 4.5 34.6-5.6 39.2-22.7s-5.6-34.6-22.7-39.2c-14.3-3.8-53.6-11.4-66.6-13.4c-44.7-7-88.3-4.2-123.7 10.9c-36.5 15.6-64.4 44.8-71.8 87.3c-.1 .6-.2 1.1-.2 1.7c-2.8 23.9 .5 45.6 10.1 64.6c4.5 9 10.2 16.9 16.7 23.9L32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l448 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-209.9 0-.4-.1-1.1-.3c-36-10.8-65.2-19.6-85.2-33.1c-9.3-6.3-15-12.6-18.2-19.1c-3.1-6.1-5.2-14.6-3.8-27.4zM348.9 337.2c2.7 6.5 4.4 15.8 1.9 30.1c-3 17.6-13.8 30.8-33.9 39.4c-21.1 9-51.7 12.3-88.5 6.5c-18-2.9-49.1-13.5-74.4-22.1c-5.6-1.9-11-3.7-15.9-5.4c-16.8-5.6-34.9 3.5-40.5 20.3s3.5 34.9 20.3 40.5c3.6 1.2 7.9 2.7 12.7 4.3c0 0 0 0 0 0s0 0 0 0c24.9 8.5 63.6 21.7 87.6 25.6c0 0 0 0 0 0l.2 0c44.7 7 88.3 4.2 123.7-10.9c36.5-15.6 64.4-44.8 71.8-87.3c3.6-21 2.7-40.4-3.1-58.1l-75.7 0c7 5.6 11.4 11.2 13.9 17.2z"></path></svg>
            </button>
            {#if !isHeading}
                <button
                        onclick={() => runCommand(chain => chain.toggleHeading({ level: 1 }))}
                        class:active={editor.isActive('heading', { level: 1 })}
                        class="menu-button"
                        title={I18n.t("heading")}
                >
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M0 64C0 46.3 14.3 32 32 32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 112 224 0 0-112-16 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 144 0 176 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-144-224 0 0 144 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-176L48 96 32 96C14.3 96 0 81.7 0 64z"></path></svg>
                </button>
            {:else}
                <button
                        onclick={() => runCommand(chain => chain.toggleHeading({ level: 1 }))}
                        class:active={editor.isActive('heading', { level: 1 })}
                        class="menu-button"
                        title={I18n.t("heading")}
                >
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M0 64C0 46.3 14.3 32 32 32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 112 224 0 0-112-16 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 144 0 176 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-144-224 0 0 144 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-176L48 96 32 96C14.3 96 0 81.7 0 64z"></path></svg>
                </button>
                <button
                        onclick={() => adjustHeading(1)}
                        class:active={editor.isActive('heading', { level: 1 })}
                        class="menu-button"
                        title={I18n.t("smallerHeading")}
                >
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M0 64C0 46.3 14.3 32 32 32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 112 224 0 0-112-16 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 144 0 176 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-144-224 0 0 144 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-176L48 96 32 96C14.3 96 0 81.7 0 64z"></path></svg>+
                </button>
                <button
                        onclick={() => adjustHeading(-1)}
                        class:active={editor.isActive('heading', { level: 1 })}
                        class="menu-button"
                        title={I18n.t("biggerHeading")}
                >
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M0 64C0 46.3 14.3 32 32 32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 112 224 0 0-112-16 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 144 0 176 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-144-224 0 0 144 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-176L48 96 32 96C14.3 96 0 81.7 0 64z"></path></svg>-
                </button>
            {/if}
            <button
                    onclick={setLink}
                    class:active={editor.isActive('link')}
                    class="menu-button"
                    title={`${I18n.t("setLink")} (Ctrl + K)`}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"><path d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5L217.7 177.2c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z"></path></svg>
            </button>
            {#if isLinkActive}
                <button
                        onclick={() => runCommand(chain => chain.unsetLink())}
                        class="menu-button"
                        title={I18n.t("unsetLink")}
                >
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"><path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L489.3 358.2l90.5-90.5c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114l-96 96-31.9-25C430.9 239.6 420.1 175.1 377 132c-52.2-52.3-134.5-56.2-191.3-11.7L38.8 5.1zM239 162c30.1-14.9 67.7-9.9 92.8 15.3c20 20 27.5 48.3 21.7 74.5L239 162zM406.6 416.4L220.9 270c-2.1 39.8 12.2 80.1 42.2 110c38.9 38.9 94.4 51 143.6 36.3zm-290-228.5L60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5l61.8-61.8-50.6-39.9z"></path></svg>
                </button>
            {/if}
            <button
                    onclick={() => runCommand(chain => chain.toggleCode())}
                    class="menu-button"
                    title={`${I18n.t("code")} (Ctrl + E)`}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M190.4 354.1L91.9 256l98.4-98.1-30-29.9L32 256l128.4 128 30-29.9zm131.2 0L420 256l-98.4-98.1 30-29.9L480 256 351.6 384l-30-29.9z"></path></svg>
            </button>
            <button
                    onclick={() => runCommand(chain => chain.toggleCodeBlock())}
                    class="menu-button"
                    title={I18n.t("codeBlock")}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"><path d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z"></path></svg>
            </button>
            <button
                    onclick={() => runCommand(chain => chain.toggleBlockquote())}
                    class="menu-button"
                    title={I18n.t("quote")}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M0 216C0 149.7 53.7 96 120 96l8 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-8 0c-30.9 0-56 25.1-56 56l0 8 64 0c35.3 0 64 28.7 64 64l0 64c0 35.3-28.7 64-64 64l-64 0c-35.3 0-64-28.7-64-64l0-32 0-32 0-72zm256 0c0-66.3 53.7-120 120-120l8 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-8 0c-30.9 0-56 25.1-56 56l0 8 64 0c35.3 0 64 28.7 64 64l0 64c0 35.3-28.7 64-64 64l-64 0c-35.3 0-64-28.7-64-64l0-32 0-32 0-72z"></path></svg>
            </button>
            <button
                    onclick={() => runCommand(chain => chain.toggleBulletList())}
                    class="menu-button"
                    title={`${I18n.t("genericList")} (Ctrl + Shift + 8)`}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M40 48C26.7 48 16 58.7 16 72l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24L40 48zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L192 64zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zM16 232l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0c-13.3 0-24 10.7-24 24zM40 368c-13.3 0-24 10.7-24 24l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0z"></path></svg>
            </button>
            <button
                    onclick={() => runCommand(chain => chain.toggleOrderedList())}
                    class="menu-button"
                    title={`${I18n.t("numberedList")}  (Ctrl + Shift + 7)`}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M61.77 401l17.5-20.15a19.92 19.92 0 0 0 5.07-14.19v-3.31C84.34 356 80.5 352 73 352H16a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8h22.83a157.41 157.41 0 0 0-11 12.31l-5.61 7c-4 5.07-5.25 10.13-2.8 14.88l1.05 1.93c3 5.76 6.29 7.88 12.25 7.88h4.73c10.33 0 15.94 2.44 15.94 9.09 0 4.72-4.2 8.22-14.36 8.22a41.54 41.54 0 0 1-15.47-3.12c-6.49-3.88-11.74-3.5-15.6 3.12l-5.59 9.31c-3.72 6.13-3.19 11.72 2.63 15.94 7.71 4.69 20.38 9.44 37 9.44 34.16 0 48.5-22.75 48.5-44.12-.03-14.38-9.12-29.76-28.73-34.88zM496 224H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm0-160H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16zm0 320H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zM16 160h64a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8H64V40a8 8 0 0 0-8-8H32a8 8 0 0 0-7.14 4.42l-8 16A8 8 0 0 0 24 64h8v64H16a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8zm-3.91 160H80a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8H41.32c3.29-10.29 48.34-18.68 48.34-56.44 0-29.06-25-39.56-44.47-39.56-21.36 0-33.8 10-40.46 18.75-4.37 5.59-3 10.84 2.8 15.37l8.58 6.88c5.61 4.56 11 2.47 16.12-2.44a13.44 13.44 0 0 1 9.46-3.84c3.33 0 9.28 1.56 9.28 8.75C51 248.19 0 257.31 0 304.59v4C0 316 5.08 320 12.09 320z"></path></svg>
            </button>
            <button
                    onclick={handleInsertImageUrl}
                    class="menu-button"
                    title={I18n.t("setImageUsingUrl")}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6l96 0 32 0 208 0c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z"></path></svg>
            </button>
            <button
                    onclick={handleInsertImageFile}
                    class="menu-button"
                    title={I18n.t("setImageUsingFile")}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg"><path d="M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-288-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0zM64 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm152 32c5.3 0 10.2 2.6 13.2 6.9l88 128c3.4 4.9 3.7 11.3 1 16.5s-8.2 8.6-14.2 8.6l-88 0-40 0-48 0-48 0c-5.8 0-11.1-3.1-13.9-8.1s-2.8-11.2 .2-16.1l48-80c2.9-4.8 8.1-7.8 13.7-7.8s10.8 2.9 13.7 7.8l12.8 21.4 48.3-70.2c3-4.3 7.9-6.9 13.2-6.9z"></path></svg>
            </button>
            <input
                    type="color"
                    class="menu-color-picker menu-button"
                    title={I18n.t("setTextColor")}
                    oninput={(e) => editor?.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
            />
            {#if isTextStyle}
                <button
                        onclick={() => runCommand(chain => chain.unsetColor())}
                        disabled={!editor?.isActive('textStyle')}
                        class="menu-button"
                        title={I18n.t("unsetTextColor")}
                >
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="M290.7 57.4L57.4 290.7c-25 25-25 65.5 0 90.5l80 80c12 12 28.3 18.7 45.3 18.7L288 480l9.4 0L512 480c17.7 0 32-14.3 32-32s-14.3-32-32-32l-124.1 0L518.6 285.3c25-25 25-65.5 0-90.5L381.3 57.4c-25-25-65.5-25-90.5 0zM297.4 416l-9.4 0-105.4 0-80-80L227.3 211.3 364.7 348.7 297.4 416z"></path></svg>
                </button>
            {/if}
        {/if}
        {#if isTableActive}
            <button onclick={() => runCommand(chain => chain.addColumnBefore())} class="menu-button" title="Add column before">{`←${I18n.t("column")}`}</button>
            <button onclick={() => runCommand(chain => chain.addColumnAfter())} class="menu-button" title="Add column after">{`${I18n.t("column")}→`}</button>
            <button onclick={() => runCommand(chain => chain.deleteColumn())} class="menu-button" title="Delete column">{I18n.t("deleteColumn")}</button>
            <button onclick={() => runCommand(chain => chain.addRowBefore())} class="menu-button" title="Add row before">{`↑${I18n.t("row")}`}</button>
            <button onclick={() => runCommand(chain => chain.addRowAfter())} class="menu-button" title="Add row after">{`${I18n.t("row")}↓`}</button>
            <button onclick={() => runCommand(chain => chain.deleteRow())} class="menu-button" title="Delete row">{I18n.t("deleteRow")}</button>
            <button onclick={() => runCommand(chain => chain.deleteTable())} class="menu-button" title="Delete table">{I18n.t("deleteTable")}</button>
        {/if}
    {/if}
</div>

<style>
    .floating-menu, .bubble-menu {
        display: flex;
        flex-wrap: wrap;
        background-color: var(--background-color);
        padding: 0.25em;
        border-radius: 5px;
        box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
        pointer-events: auto; /* Allow interaction */
    }

    .menu-button {
        display: flex;
        background: none;
        border: none;
        color: var(--main-text);
        padding: 0.3rem 0.6rem;
        margin: 0 0.1rem;
        cursor: pointer;
        border-radius: 3px;
        font-size: 0.9em;
        transition: background-color 0.2s ease;
        white-space: nowrap;
        align-content: center;
    }

    .menu-button:hover {
        background-color: var(--border);
    }

    .menu-button.active {
        color: var(--main-text);
    }

    .menu-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .menu-button svg {
        width: 1.25em;
        height: 1.25em;
    }

    /* Tiptap editor content styling */
    .editor-content :global(.ProseMirror) {
        border: 2px solid transparent;
        padding: 0.5em 0.25em;
        min-height: 3em;
        border-radius: 0.5em;
        outline: none;
        transition: 0.3s;
        font-feature-settings: 'liga' on, 'clig' on !important;
        font-variant-ligatures: common-ligatures !important;
        word-break: break-word;
        white-space: break-spaces;
    }

    :global(.editor-content *:first-child) {
        margin-top: 0;
    }

    :global(.editor-content *:last-child) {
        margin-bottom: 0;
    }

    .editor-content :global(.ProseMirror-focused), .editor-content:hover :global(.ProseMirror) {
        box-shadow: 0 0 0 0;
        border: 2px solid var(--accent);
    }

    .editor-content :global(a) {
        color: var(--color-accent-fg);
        cursor: pointer;
    }

    .editor-content :global(a:hover) {
        text-decoration: underline;
    }

    :global(.details) {
        display: flex;
        gap: 0.25rem;
        margin: 1.5rem 0;
        border: 1px solid var(--border);
        border-radius: 0.5rem;
        padding: 0.5rem;
    }

    :global(.details summary) {
        font-weight: bold;
    }

    :global(.details > button) {
        align-items: center;
        background: transparent;
        display: flex;
        font-size: 0.625rem;
        height: 1.25rem;
        justify-content: center;
        line-height: 1;
        margin-top: 0.1rem;
        padding: 0;
        width: 1.25rem;
        border: none;
        border-radius: 0.5em;
        transition: 0.2s;
    }

    :global(.details > button:hover) {
        background-color: var(--border);
    }

    :global(.details > button::before) {
        transition: 0.3s;
        content: '\25B6';
    }

    :global(.details.is-open > button::before) {
        transform: rotate(90deg);
    }

    :global(.details > div) {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 100%;
    }

    :global(.details > div > [data-type="detailsContent"] > :last-child) {
        margin-bottom: 0.5rem;
    }

    :global(.details .details) {
        margin: 0.5rem 0;
    }

    :global(summary::marker) {
        color: transparent;
    }

    .menu-color-picker {
        appearance: none;
        border: none;
        width: 2.5em;
        height: 2em;
        padding: 0.25em 0.5em;
    }

    .menu-color-picker::-webkit-color-swatch-wrapper {
        padding: 0;
    }

    .menu-color-picker::-webkit-color-swatch {
        border: none;
        border-radius: 0.25em;
    }

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

    /* Placeholder text for when the text editor is empty */
    :global(.tiptap p.is-editor-empty:first-child::before) {
        color: var(--unselected-button);
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
    }
</style>