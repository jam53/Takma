<script lang="ts">
    import {onDestroy, onMount} from 'svelte';
    import {Editor, markInputRule} from '@tiptap/core';
    import StarterKit from '@tiptap/starter-kit';
    import {BubbleMenu} from "@tiptap/extension-bubble-menu";
    import Bold from '@tiptap/extension-bold';
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
    import {Placeholder} from "@tiptap/extension-placeholder";
    import {openUrl} from "@tauri-apps/plugin-opener";
    import TextEditorActionButtons from "./TextEditorActionButtons.svelte";
    import {Markdown} from "@tiptap/markdown";
    import Details, {DetailsContent, DetailsSummary} from "@tiptap/extension-details";

    interface Props {
        cardDescription: string;
        getImageUrl: (imageSrc: string) => string;
        switchToPlainTextEditor: () => void;
        editable?: boolean;
    }

    let {
        cardDescription = $bindable(),
        getImageUrl,
        switchToPlainTextEditor,
        editable = true,
    }: Props = $props();

    let editorElement: HTMLDivElement;
    let bubbleMenuElement: HTMLDivElement;
    let floatingMenuElement: HTMLDivElement;
    let editor: Editor | null = $state(null);

    let isTableActive = $state(false);
    let isLinkActive = $state(false);
    let isSelectionEmpty = $state(false);
    let isHeading = $state(false);

    onMount(() => {
        if (!bubbleMenuElement || !floatingMenuElement)
        {
            console.error("Menu elements not found on mount!");
            return;
        }

        editor = new Editor({
            element: editorElement,
            content: normalizeContentForTiptapEditor(cardDescription),
            contentType: 'markdown',
            editable: editable,
            editorProps: {
                attributes: {
                    spellcheck: "false"
                },
                handleClickOn(view, pos, node, nodePos, event, direct) {
                    const targetElement = event.target as HTMLElement;

                    // Handle LMB clicks on regular http/https links using Tauri's `openUrl()` to ensure it opens in the user's default browser rather than in a new Tauri window
                    if(event.button === 0 && targetElement.closest("a")?.hasAttribute('href'))
                    {
                        event.preventDefault();
                        event.stopPropagation();
                        openUrl(targetElement.closest("a")!.getAttribute('href')!);
                        return true; // Signals that the "click" was handled
                    }

                    return false; // Let Tiptap handle other clicks
                },
            },
            extensions: [
                StarterKit.configure({
                    codeBlock: false,
                    bold: false,
                    link: false,
                    underline: false,
                }),
                BubbleMenu.configure({
                    element: bubbleMenuElement,
                    options: {
                        placement: "top-start"
                    },
                }),
                // Floating menu, for actions on empty lines
                FloatingMenu.extend({
                    addOptions() {
                        return {
                            ...this.parent?.(),
                            placement: 'top-start',
                            shouldShow: ({ editor, view, state }) => {
                                const { selection } = state;
                                const anchor = selection.$anchor;

                                const currentNode = anchor.parent;

                                if (currentNode.type.name !== 'paragraph' && currentNode.type.name !== 'heading') {
                                    return false;
                                }

                                const nodeText = currentNode.textContent;

                                // Only show if the line contains only '/' (with optional whitespace)
                                return nodeText.trim() === '/';
                            },
                        };
                    },
                }).configure({
                    element: floatingMenuElement,
                }),
                Markdown.configure({
                    markedOptions: {
                        gfm: true,
                        breaks: true,
                    }
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
                    // Ensure underline is serialized as `__text__` in Markdown instead of the default `++text++`
                    renderMarkdown: (mark: any, helpers: any) => {
                        return `__${helpers.renderChildren(mark)}__`;
                    },
                }),
                TextStyle.extend({
                    renderMarkdown: (node: any, helpers: any) => {
                        const color = node.attrs?.color;
                        if (color) {
                            // Wrap content with HTML span containing color style
                            // Note: If multiple adjacent text nodes have different colors,
                            // they may be grouped here. This is fixed in post-processing
                            // by the fixGroupedColorSpans function.
                            return `<span style="color: ${color}">${helpers.renderChildren(node)}</span>`;
                        }
                        return helpers.renderChildren(node);
                    },
                }), // Needs to be added before the Color extension
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
                    placeholder: ({ editor }) => {
                        return editor.getMarkdown() === "" ? I18n.t("addDetailedDescriptionMarkdown") :  I18n.t("typeSlashForCommands");
                    },
                }),
            ],
            onTransaction: () => {
                isTableActive = editor?.isActive('table') ?? false;
                isLinkActive = editor?.isActive('link') ?? false;
                isSelectionEmpty = editor?.state.selection.empty ?? false;
                isHeading = editor?.isActive('heading') ?? false;
            },
            onUpdate: ({editor}) => {
                let markdown = editor.getMarkdown();
                markdown = fixGroupedColorSpans(markdown, editor);
                cardDescription = tiptapDetailsSummaryToMarkdownSyntax(markdown);
            },
            onCreate: ({editor}) => {
                // Force placeholder to show on initial load if editor is empty
                // This ensures the placeholder is visible without requiring user interaction
                if (editor.getMarkdown() === "") {
                    // Trigger a view update to show the placeholder
                    // This forces the placeholder extension to re-evaluate and display
                    const { state, view } = editor;
                    const transaction = state.tr;
                    view.dispatch(transaction);
                }
                
                // Post-process the content to inject color information from HTML spans
                // This handles cases where inline HTML in markdown isn't recognized as HTML tokens
                injectColorFromHTMLSpans(editor);
            },
        });
    });

    /**
     * This function solves the problem where custom "takma://" links aren't recognized as links when the editor is initially loaded. Causing them to be displayed as a plain text string, rather than being displayed as the TakmaLink.svelte component. We solve this by parsing any Takma links and wrapping them with angle brackets, which will allow Tiptap's Markdown processor to recognize the Takma links as actual links.
      */
    function parseTakmaLinks(markdownContent: string): string
    {
        // Regex to find takma:// links that are not already inside angle brackets (<...>)
        // - (?<!<) : Negative lookbehind assertion. Ensures the match doesn't start immediately after '<'.
        //             This prevents modifying links that are already formatted as autolinks.
        // - (takma:\/\/[\w-]+(?:\/[\w-]+)?) : Capturing group 1. Matches and captures the actual Takma link string.
        const takmaRegex = /(?<!<)(takma:\/\/[\w-]+(?:\/[\w-]+)?)/g;

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

        return markdownContent;
    }

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

    /**
     * Removes the '/' character from the current line if it exists, then runs the provided command.
     * This is used when the floating menu is triggered by typing '/'.
     */
    const runCommandAndRemoveSlash = (command: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) => {
        if (!editor) return;
        
        const { state } = editor;
        const { selection } = state;
        const anchor = selection.$anchor;
        const currentNode = anchor.parent;
        
        if (currentNode.textContent.trim() === '/') {
            // Select the entire node content and delete it
            const nodeStart = anchor.start(anchor.depth);
            const nodeEnd = anchor.end(anchor.depth);
            
            // Delete the entire content of the node (which is just '/')
            editor.chain()
                .focus()
                .setTextSelection({ from: nodeStart, to: nodeEnd })
                .deleteSelection()
                .run();
        }
        
        command(editor.chain().focus()).run();
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
            runCommandAndRemoveSlash(chain => chain.setImage({src: imgUrl}));
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
            runCommandAndRemoveSlash(chain => chain.setImage({src: imgUrl}));
        }
    }

    /**
     * Runs all custom parsing logic required before loading content into the Tiptap editor.
     *
     * @param markdownContent The raw Markdown string.
     * @returns The fully processed Markdown string ready for the Tiptap editor.
     */
    function normalizeContentForTiptapEditor(markdownContent: string): string {
        markdownContent = parseTakmaLinks(markdownContent);
        markdownContent = ensureBlockWrapperForImages(markdownContent);
        markdownContent = markdownDetailsSummaryToTiptapSyntax(markdownContent);
        markdownContent = convertDoubleUnderscoreUnderlineToPlusSyntax(markdownContent);

        return markdownContent;
    }

    /**
     * Converts Markdown underline written as `__text__` into Tiptap's default underline
     * syntax `++text++` before the Markdown content is parsed by the Tiptap Markdown
     * extension.
     *
     * This ensures that:
     * - existing content stored with `__underline__` is interpreted as underline (not bold),
     * - while our custom `renderMarkdown` on the underline mark still serializes back to `__text__`.
     */
    function convertDoubleUnderscoreUnderlineToPlusSyntax(markdownContent: string): string {
        // Match any `__text__` span (no newlines inside), and convert it to `++text++`
        // so that Tiptap's Markdown parser treats it as underline, not bold.
        const underlineRegex = /__(?!\s+__)([^_\n]+?)__(?!_)/gm;

        return markdownContent.replace(underlineRegex, (match, content) => {
            return `++${content}++`;
        });
    }

    /**
     * Pre-processes Markdown content to insert a Zero Width Space (ZWSP)
     * before standalone inline images. This fixes a Tiptap V3 schema validation issue
     * (contentMatchAt) when an inline node is the first element after an empty block.
     * @param markdownContent The original Markdown string.
     * @returns The processed Markdown string.
     */
    function ensureBlockWrapperForImages(markdownContent: string): string {
        const ZWSP = '\u200B';

        // Regex: Finds an image markdown link: ![]()
        //        that is preceded only by the start of the string (^) or one or more newline characters (\n+).
        // The image link itself is captured in group 2.
        const imageOnlyRegex = /(\n|^)(\s*!\[.*?\]\(.*?\))/g;

        markdownContent = markdownContent.replace(imageOnlyRegex, (match, p1_preceding, p2_image) => {
            // p1_preceding is the preceding newlines/start of string
            // p2_image is the image markdown

            return p1_preceding + ZWSP + p2_image.trim();
        });

        return markdownContent;
    }

    /**
     * Converts Tiptap specific ":::details" Markdown syntax into standard HTML <details> and <summary> tags.
     *
     * @param text The raw markdown from Tiptap's editor.getMarkdown().
     * @returns Markdown mixed with standard HTML <details> and <summary> tags.
     */
    function tiptapDetailsSummaryToMarkdownSyntax(text: string): string {
        while (true) {
            // Find all openers
            // We list "detailsSummary" and "detailsContent" BEFORE "details"
            // so the regex doesn't prematurely match the "details" prefix.
            const openerRegex = /^:::(detailsSummary|detailsContent|details)(.*)$/gm;

            let lastOpener = null;
            let match;

            // Find the deepest/last nested block
            while ((match = openerRegex.exec(text)) !== null) {
                lastOpener = match;
            }

            if (!lastOpener) break;

            const [fullLine, tagName, params] = lastOpener;
            const startIndex = lastOpener.index;

            // Find the closer ":::"
            const textAfterOpener = text.slice(startIndex + fullLine.length);
            const closerRegex = /^:::$/m;
            const closerMatch = closerRegex.exec(textAfterOpener);

            if (!closerMatch) break;

            const closerIndexRelative = closerMatch.index;
            const closerLength = closerMatch[0].length;

            // Extract and Trim Content
            const rawContent = textAfterOpener.slice(0, closerIndexRelative);
            const content = rawContent.trim();

            // Generate Replacement HTML
            let replacement = "";
            if (tagName === "detailsSummary") {
                replacement = `<summary>${content}</summary>`;
            } else if (tagName === "detailsContent") {
                // Unwrap content: Just return the text inside
                replacement = content;
            } else if (tagName === "details") {
                // Check for {open} in the params captured from the first line
                const openAttr = params && params.includes("{open}") ? " open" : "";
                replacement = `<details${openAttr}>\n${content}\n</details>`;
            }

            // Replace
            const totalBlockLength = fullLine.length + closerIndexRelative + closerLength;
            text = text.slice(0, startIndex) + replacement + text.slice(startIndex + totalBlockLength);
        }

        return text;
    }

    /**
     * Converts standard HTML <details> and <summary> tags back into Tiptap specific ":::details" Markdown syntax.
     *
     * @param text The text containing HTML <details> and <summary> tags
     * @returns Text converted back to Tiptap Markdown syntax
     */
    function markdownDetailsSummaryToTiptapSyntax(text: string): string {
        // We loop until no <details> tags remain in the text
        while (true) {
            // REGEX EXPLANATION:
            // <details\b([^>]*)>       -> Match opening tag and capture attributes (Group 1)
            // (                         -> Start Group 2 (The Content)
            //   (?:                     -> Start non-capturing group for repetition
            //     (?!<details\b)        -> Negative Lookahead: Stop if we see a nested <details> start tag
            //     [\s\S]                -> Match ANY character (including newlines!)
            //   )*?                     -> Repeat lazily
            // )                         -> End Group 2
            // <\/details>               -> Match closing tag
            const leafDetailsRegex = /<details\b([^>]*)>((?:(?!<details\b)[\s\S])*?)<\/details>/i;

            const match = text.match(leafDetailsRegex);

            // If no match is found, we are done
            if (!match) break;

            // Perform the replacement for this specific block
            text = text.replace(leafDetailsRegex, (wholeMatch, attrs, innerContent) => {
                const openSyntax = attrs && attrs.toLowerCase().includes("open") ? " {open}" : "";

                // Extract <summary> using the same [\s\S] trick for safety
                const summaryRegex = /<summary>([\s\S]*?)<\/summary>/i;
                const summaryMatch = innerContent.match(summaryRegex);

                let summaryText = "Details"; // Default fallback
                let contentText = innerContent;

                if (summaryMatch) {
                    summaryText = summaryMatch[1].trim();
                    // Remove the summary tag to leave just the content
                    contentText = innerContent.replace(summaryRegex, "").trim();
                } else {
                    contentText = innerContent.trim();
                }

                // Return Tiptap Format
                // We ensure there are blank lines between every block so Tiptap parses it correctly.
                return `
:::details${openSyntax}

:::detailsSummary

${summaryText}

:::

:::detailsContent

${contentText}

:::

:::
`;
            });
        }

        return text;
    }

    /**
     * Fixes incorrectly grouped color spans in markdown.
     * When multiple adjacent text nodes have different colors, Tiptap's markdown renderer
     * sometimes groups them into a single span. This function splits them correctly.
     */
    function fixGroupedColorSpans(markdown: string, editor: Editor): string {
        if (!editor) return markdown;

        // Get the editor's JSON to see what colors each character should have
        const json = editor.getJSON();
        if (!json.content) return markdown;

        // Build a map of character positions to their colors
        const colorMap: Array<{ text: string; color: string | null; index: number }> = [];

        function traverseNode(node: any, textOffset: number): number {
            if (node.type === 'text' && node.text) {
                const colorMark = node.marks?.find((m: any) => m.type === 'textStyle' && m.attrs?.color);
                const color = colorMark?.attrs?.color || null;

                for (let i = 0; i < node.text.length; i++) {
                    colorMap.push({
                        text: node.text[i],
                        color,
                        index: textOffset + i
                    });
                }

                return textOffset + node.text.length;
            }

            if (node.content && Array.isArray(node.content)) {
                let currentOffset = textOffset;
                for (const child of node.content) {
                    currentOffset = traverseNode(child, currentOffset);
                }
                return currentOffset;
            }

            return textOffset;
        }

        traverseNode(json, 0);

        // Find all color spans in the markdown
        const colorSpanRegex = /<span\s+style\s*=\s*["']color:\s*([^"']+)["'][^>]*>(.*?)<\/span>/gis;
        const matches: Array<{ fullMatch: string; color: string; content: string; index: number }> = [];

        let match;
        while ((match = colorSpanRegex.exec(markdown)) !== null) {
            matches.push({
                fullMatch: match[0],
                color: match[1].trim(),
                content: match[2],
                index: match.index
            });
        }

        // Process each color span
        let result = markdown;
        let offset = 0; // Track offset from previous replacements

        for (const spanMatch of matches) {
            const spanContent = spanMatch.content;

            // Find the position of this span's content in the color map
            // We need to find where this text appears in the editor's content
            const spanStartInMarkdown = spanMatch.index + offset;

            // Try to find the text in the color map
            // Since we don't have exact position mapping, we'll search for the text pattern
            let foundStart = -1;
            for (let i = 0; i < colorMap.length - spanContent.length + 1; i++) {
                const segment = colorMap.slice(i, i + spanContent.length).map(c => c.text).join('');
                if (segment === spanContent) {
                    foundStart = i;
                    break;
                }
            }

            // If we found the text and it has multiple colors, split it
            if (foundStart !== -1 && spanContent.length > 1) {
                const segmentColors = colorMap.slice(foundStart, foundStart + spanContent.length).map(c => c.color);
                const uniqueColors = new Set(segmentColors.filter(Boolean));

                // If there are multiple colors, split the span
                if (uniqueColors.size > 1) {
                    let splitContent = '';
                    let currentColor: string | null = null;
                    let currentText = '';

                    for (let i = 0; i < spanContent.length; i++) {
                        const charColor = colorMap[foundStart + i]?.color || null;

                        if (charColor !== currentColor) {
                            // Color changed - close previous span and start new one
                            if (currentText) {
                                if (currentColor) {
                                    splitContent += `<span style="color: ${currentColor}">${currentText}</span>`;
                                } else {
                                    splitContent += currentText;
                                }
                            }
                            currentColor = charColor;
                            currentText = spanContent[i];
                        } else {
                            currentText += spanContent[i];
                        }
                    }

                    // Close the last span
                    if (currentText) {
                        if (currentColor) {
                            splitContent += `<span style="color: ${currentColor}">${currentText}</span>`;
                        } else {
                            splitContent += currentText;
                        }
                    }

                    // Replace the grouped span with the split version
                    const before = result.substring(0, spanStartInMarkdown);
                    const after = result.substring(spanStartInMarkdown + spanMatch.fullMatch.length);
                    result = before + splitContent + after;
                    offset += splitContent.length - spanMatch.fullMatch.length;
                }
            }
        }

        return result;
    }

    /**
     * Post-processes the editor content to inject color information from HTML spans in the original markdown.
     * This handles cases where inline HTML in markdown isn't recognized as HTML tokens by the parser.
     */
    function injectColorFromHTMLSpans(editor: Editor) {
        if (!editor) return;
        
        // Get the original markdown to find HTML color spans
        const originalMarkdown = cardDescription;
        if (!originalMarkdown) return;

        // Find all HTML color spans in the markdown
        const colorSpanRegex = /<span\s+style\s*=\s*["']([^"']*color[^"']*)["'][^>]*>(.*?)<\/span>/gis;
        const colorSpans: Array<{ color: string; text: string; index: number }> = [];

        let match;
        while ((match = colorSpanRegex.exec(originalMarkdown)) !== null) {
            const styleAttr = match[1];
            const content = match[2];
            const colorMatch = styleAttr.match(/color\s*:\s*([^;]+)/i);

            if (colorMatch) {
                const color = colorMatch[1].trim();
                // Find the position of this span in the markdown (before HTML tags)
                const beforeSpan = originalMarkdown.substring(0, match.index);
                const plainTextBefore = beforeSpan.replace(/<[^>]+>/g, ''); // Remove all HTML tags
                const textIndex = plainTextBefore.length;

                colorSpans.push({
                    color,
                    text: content,
                    index: textIndex
                });
            }
        }

        if (colorSpans.length === 0) return;

        // Get the current editor JSON and create a deep copy to modify
        const json = JSON.parse(JSON.stringify(editor.getJSON()));
        if (!json.content) return;

        // Traverse the JSON to find text nodes and apply color marks
        function applyColorsToNode(node: any, textOffset: number, usedSpans: Set<number>): number {
            if (node.type === 'text' && node.text) {
                const nodeStart = textOffset;
                const nodeEnd = textOffset + node.text.length;
                
                // Check each color span to see if it matches this text node
                for (let i = 0; i < colorSpans.length; i++) {
                    if (usedSpans.has(i)) continue; // Skip already used spans
                    
                    const span = colorSpans[i];
                    const spanStart = span.index;
                    const spanEnd = span.index + span.text.length;
                    
                    // Try to find the span's text in this node's text
                    // We use a more flexible matching approach
                    const textIndex = node.text.indexOf(span.text);
                    
                    if (textIndex !== -1) {
                        // Found the text in this node
                        // Check if the position is approximately correct
                        const expectedRelativeStart = Math.max(0, spanStart - nodeStart);
                        const positionDiff = Math.abs(textIndex - expectedRelativeStart);
                        
                        // Allow small position differences (markdown parser might split differently)
                        if (positionDiff <= 5 || textIndex === 0) {
                            // Check if this is an exact match (entire node)
                            const isExactMatch = textIndex === 0 && span.text.length === node.text.length;
                            
                            if (isExactMatch) {
                                // Exact match - apply color to entire node
                                // Create a new marks array to ensure proper structure
                                const existingMarks = (node.marks || []).filter((m: any) => m.type !== 'textStyle');
                                const newMarks = [
                                    ...existingMarks,
                                    {
                                        type: 'textStyle',
                                        attrs: { color: span.color }
                                    }
                                ];
                                node.marks = newMarks;
                                
                                console.log(`Applied color ${span.color} to text node: "${node.text}"`);
                                
                                usedSpans.add(i);
                                break; // Only apply one color per node
                            } else if (textIndex === 0 && node.text.startsWith(span.text)) {
                                // Partial match at the start - apply color to entire node for now
                                // (Ideally we'd split, but this is a workaround)
                                const existingMarks = (node.marks || []).filter((m: any) => m.type !== 'textStyle');
                                const newMarks = [
                                    ...existingMarks,
                                    {
                                        type: 'textStyle',
                                        attrs: { color: span.color }
                                    }
                                ];
                                node.marks = newMarks;
                                
                                console.log(`Applied color ${span.color} to partial text node: "${node.text}" (matched "${span.text}")`);
                                
                                usedSpans.add(i);
                                break;
                            }
                        }
                    }
                }

                return textOffset + node.text.length;
            }

            if (node.content && Array.isArray(node.content)) {
                let currentOffset = textOffset;
                for (const child of node.content) {
                    currentOffset = applyColorsToNode(child, currentOffset, usedSpans);
                }
                return currentOffset;
            }

            return textOffset;
        }
        
        // Track which spans have been used
        const usedSpans = new Set<number>();

        // Apply colors to all nodes
        applyColorsToNode(json, 0, usedSpans);

        // Debug: log to verify marks are being added
        console.log('Color spans found:', colorSpans);
        console.log('Modified JSON sample (first text node with marks):', 
            JSON.stringify(json.content?.[0]?.content?.find((n: any) => n.type === 'text' && n.marks), null, 2));

        // Update the editor with the modified JSON
        editor.commands.setContent(json);
    }
</script>

<!-- Tiptap text editor component -->
<div bind:this={editorElement} class="editor-content" class:noBorder={!editable}></div>

<!-- Buttons to switch to the plain text editor, copy the description as Markdown or to copy the description as plain text -->
{#if cardDescription && editor && editable}
    <TextEditorActionButtons {cardDescription} tiptapEditor={editor} otherEditorName={I18n.t("plainTextEditor")} switchToOtherTextEditor={switchToPlainTextEditor}/>
{/if}

<!-- Floating Menu -->
<!-- Shown on empty lines -->
<div bind:this={floatingMenuElement} class="floating-menu">
    {#if editor}
        {#if !isHeading}
            <button
                    onclick={() => runCommandAndRemoveSlash(chain => chain.toggleHeading({ level: 1 }))}
                    class:active={editor.isActive('heading', { level: 1 })}
                    class="menu-button"
                        title={I18n.t("heading")}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M0 64C0 46.3 14.3 32 32 32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 112 224 0 0-112-16 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l48 0 48 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-16 0 0 144 0 176 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-144-224 0 0 144 16 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-48 0-48 0c-17.7 0-32-14.3-32-32s14.3-32 32-32l16 0 0-176L48 96 32 96C14.3 96 0 81.7 0 64z"></path></svg>
            </button>
        {:else}
            <button
                    onclick={() => runCommandAndRemoveSlash(chain => chain.toggleHeading({ level: 1 }))}
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
                onclick={() => runCommandAndRemoveSlash(chain => chain.toggleCodeBlock())}
                class="menu-button"
                title={I18n.t("codeBlock")}
        >
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 640 512" xmlns="http://www.w3.org/2000/svg"><path d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z"></path></svg>
        </button>
        <button
                onclick={() => runCommandAndRemoveSlash(chain => chain.toggleBlockquote())}
                class="menu-button"
                title={I18n.t("quote")}
        >
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M0 216C0 149.7 53.7 96 120 96l8 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-8 0c-30.9 0-56 25.1-56 56l0 8 64 0c35.3 0 64 28.7 64 64l0 64c0 35.3-28.7 64-64 64l-64 0c-35.3 0-64-28.7-64-64l0-32 0-32 0-72zm256 0c0-66.3 53.7-120 120-120l8 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-8 0c-30.9 0-56 25.1-56 56l0 8 64 0c35.3 0 64 28.7 64 64l0 64c0 35.3-28.7 64-64 64l-64 0c-35.3 0-64-28.7-64-64l0-32 0-32 0-72z"></path></svg>
        </button>
        <button
                onclick={() => runCommandAndRemoveSlash(chain => chain.toggleBulletList())}
                class="menu-button"
                title={`${I18n.t("genericList")} (Ctrl + Shift + 8)`}
        >
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M40 48C26.7 48 16 58.7 16 72l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24L40 48zM192 64c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L192 64zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zm0 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-288 0zM16 232l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0c-13.3 0-24 10.7-24 24zM40 368c-13.3 0-24 10.7-24 24l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0z"></path></svg>
        </button>
        <button
                onclick={() => runCommandAndRemoveSlash(chain => chain.toggleOrderedList())}
                class="menu-button"
                title={`${I18n.t("numberedList")}  (Ctrl + Shift + 7)`}
        >
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M61.77 401l17.5-20.15a19.92 19.92 0 0 0 5.07-14.19v-3.31C84.34 356 80.5 352 73 352H16a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8h22.83a157.41 157.41 0 0 0-11 12.31l-5.61 7c-4 5.07-5.25 10.13-2.8 14.88l1.05 1.93c3 5.76 6.29 7.88 12.25 7.88h4.73c10.33 0 15.94 2.44 15.94 9.09 0 4.72-4.2 8.22-14.36 8.22a41.54 41.54 0 0 1-15.47-3.12c-6.49-3.88-11.74-3.5-15.6 3.12l-5.59 9.31c-3.72 6.13-3.19 11.72 2.63 15.94 7.71 4.69 20.38 9.44 37 9.44 34.16 0 48.5-22.75 48.5-44.12-.03-14.38-9.12-29.76-28.73-34.88zM496 224H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zm0-160H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16V80a16 16 0 0 0-16-16zm0 320H176a16 16 0 0 0-16 16v32a16 16 0 0 0 16 16h320a16 16 0 0 0 16-16v-32a16 16 0 0 0-16-16zM16 160h64a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8H64V40a8 8 0 0 0-8-8H32a8 8 0 0 0-7.14 4.42l-8 16A8 8 0 0 0 24 64h8v64H16a8 8 0 0 0-8 8v16a8 8 0 0 0 8 8zm-3.91 160H80a8 8 0 0 0 8-8v-16a8 8 0 0 0-8-8H41.32c3.29-10.29 48.34-18.68 48.34-56.44 0-29.06-25-39.56-44.47-39.56-21.36 0-33.8 10-40.46 18.75-4.37 5.59-3 10.84 2.8 15.37l8.58 6.88c5.61 4.56 11 2.47 16.12-2.44a13.44 13.44 0 0 1 9.46-3.84c3.33 0 9.28 1.56 9.28 8.75C51 248.19 0 257.31 0 304.59v4C0 316 5.08 320 12.09 320z"></path></svg>
        </button>
        <button
                onclick={() => runCommandAndRemoveSlash(chain => chain.setHorizontalRule())}
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
                onclick={() => runCommandAndRemoveSlash(chain => chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }))}
                class="menu-button"
                title={I18n.t("insertTable")}
        >
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M64 256l0-96 160 0 0 96L64 256zm0 64l160 0 0 96L64 416l0-96zm224 96l0-96 160 0 0 96-160 0zM448 256l-160 0 0-96 160 0 0 96zM64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32z"></path></svg>
        </button>
        <button onclick={() => runCommandAndRemoveSlash(chain => chain.setDetails())}
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
            <button
                    onclick={() => runCommand(chain => chain.unsetAllMarks())}
                    class="menu-button"
                    title={I18n.t("clearFormatting")}
            >
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="2 4 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M3.27 5 2 6.27l6.97 6.97L6.5 19h3l1.57-3.66L16.73 21 18 19.73 3.55 5.27 3.27 5zM6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6z"/></svg>
            </button>
            <input
                    type="color"
                    class="menu-color-picker menu-button"
                    title={I18n.t("setTextColor")}
                    oninput={(e) => editor?.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
            />
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
        /*
         * Hide the menus by default.
         * Tiptap will dynamically add `style="visibility: visible; opacity: 1;"` to show them.
         */
        visibility: hidden;
        opacity: 0;

        display: flex;
        flex-wrap: wrap;
        max-width: 22em;
        background-color: var(--background-color);
        padding: 0.25em;
        border-radius: 5px;
        box-shadow: 0 0 0.6em rgba(var(--main-text-rgb-values), 0.25);
        pointer-events: auto; /* Allow interaction */
        z-index: 1;
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

    .noBorder :global(.ProseMirror-focused), .noBorder:hover :global(.ProseMirror) {
        border: 2px solid transparent;
    }

    .editor-content :global(a) {
        color: var(--color-accent-fg);
        cursor: pointer;
    }

    .editor-content :global(a:hover) {
        text-decoration: underline;
    }

    /* Ensures hyperlinked text remains visually distinct when selected.
       Standard selection highlighting overrides the text color, making links look identical to plain text. */
    .editor-content :global(a::selection) {
        color: var(--color-accent-fg);
        text-decoration: underline;

        background-color: rgba(var(--main-text-rgb-values), 0.1);
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
        cursor: pointer;
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
        content: none;
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

    /* Placeholder text for when the text editor is empty */
    :global(.tiptap p.is-editor-empty:first-child::before) {
        color: var(--unselected-button);
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none;
    }

    :global(.ProseMirror p.is-empty::before) {
        /* Use the content from the data attribute added by the Tiptap placeholder extension */
        content: attr(data-placeholder);

        /* Styling to make it look like ghost text */
        color: var(--border);
        float: left; /* Helps with layout, e.g. placing cursor in front of the placeholder text */
        height: 0; /* Prevents the placeholder from affecting line height */
        pointer-events: none; /* Allows clicks to pass through to the underlying editor */
    }
</style>