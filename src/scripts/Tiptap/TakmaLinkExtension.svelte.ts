import {
    Node,
    nodeInputRule,
    nodePasteRule,
    mergeAttributes,
    type NodeViewProps,
} from "@tiptap/core";
import type {Node as ProseMirrorNode} from "@tiptap/pm/model";
import {mount, type SvelteComponent} from "svelte";
import TakmaLink from "../../components/BoardScreen/Tiptap/TakmaLink.svelte";

export interface TakmaLinkOptions {
    /**
     * HTML attributes to add to the wrapper element.
     */
    HTMLAttributes: Record<string, any>;
    /**
     * Whether the node should be inline or block.
     */
    inline: boolean;
}

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        takmaLink: {
            /**
             * Insert a takma link
             * @param attributes The attributes for the takma link, requires "takmaLink" attribute.
             * @example editor.commands.insertTakmaLink({ takmaLink: "takma://board-1/card-abc" })
             */
            insertTakmaLink: (attributes: { takmaLink: string }) => ReturnType;
            /**
             * Set selected text as a takma link.
             * Currently just inserts a link at the cursor position.
             */
            setTakmaLink: (attributes: { takmaLink: string }) => ReturnType;
        };
    }
}

// Regex to find Takma links for paste rule (global)
export const takmaPasteRegex = /takma:\/\/([\w-]+)(?:\/([\w-]+))?/gi;

// Regex to find Takma links for input rule (match at the end of input, needs space)
// Captures the full link in group 1
export const takmaInputRegex = /(?:^|\s)(takma:\/\/[\w-]+(?:\/[\w-]+)?)\s$/;

export const TakmaLinkExtensionSvelte = Node.create<TakmaLinkOptions>({
    name: "takmaLink",

    addOptions() {
        return {
            HTMLAttributes: {},
            inline: true, // Treat this as an inline element like text
        };
    },

    inline() {
        return this.options.inline;
    },

    group() {
        return this.options.inline ? "inline" : "block";
    },

    // Make the node non-editable and treated as a single unit
    atom: true,

    // Define the "takmaLink" attribute to store the link string
    addAttributes() {
        return {
            takmaLink: {
                default: null,
                // Parse from HTML element's attribute
                parseHTML: element => element.getAttribute("data-takma-link"),
                // Render attribute onto the HTML element
                renderHTML: attributes => {
                    if (!attributes.takmaLink) {
                        return {};
                    }
                    return {
                        "data-takma-link": attributes.takmaLink,
                    };
                },
            },
        };
    },

    // How to recognize this node when pasting/loading HTML
    parseHTML() {
        return [
            {
                // Match our custom span representation
                tag: `span[data-takma-link]`,
            },
            {
                // Match the custom element itself (if used directly in source HTML)
                tag: `takma-link[takmalink]`,
                getAttrs: element => {
                    const link = (element as HTMLElement).getAttribute("takmalink");
                    return link ? { takmaLink: link } : false;
                }
            },
            {
                // Rule to catch links potentially created by markdown parser
                tag: "a[href]",
                // Optional: Increase priority slightly if needed to run before default Link mark
                // priority: 51,
                getAttrs: node => {
                    const element = node as HTMLAnchorElement;
                    const href = element.getAttribute("href");
                    // Check if the href starts with "takma://"
                    if (href && href.startsWith("takma://")) {
                        // Create TakmaLink node attributes
                        return { takmaLink: href };
                    }
                    // Let other rules handle non-Takma links
                    return false;
                },
            },
        ];
    },

    // How the node is represented in basic HTML output (e.g., editor.getHTML())
    // The Node View will override this visually in the editor.
    renderHTML({ node, HTMLAttributes }) {
        return [
            "span",
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
            // Display the link string as fallback content or for basic HTML output
            node.attrs.takmaLink || "Invalid Takma Link"
        ];
    },

    addCommands() {
        return {
            insertTakmaLink: attributes => ({ commands }) => {
                if (!attributes?.takmaLink) {
                    console.error("TakmaLink: 'takmaLink' attribute is required.");
                    return false;
                }
                // Validate the link format minimally before inserting
                if (!/takma:\/\/[\w-]+(?:\/[\w-]+)?/i.test(attributes.takmaLink)) {
                    console.error("TakmaLink: Invalid format for 'takmaLink'.", attributes.takmaLink);
                    return false;
                }
                return commands.insertContent({
                    type: this.name,
                    attrs: attributes,
                });
            },
        };
    },

    // Convert pasted takma:// links into nodes
    addPasteRules() {
        return [
            nodePasteRule({
                find: takmaPasteRegex,
                type: this.type,
                getAttributes: match => {
                    // match[0] contains the full matched Takma link string
                    return { takmaLink: match[0] };
                },
            }),
        ];
    },

    // Convert typed takma:// link + space into a node
    addInputRules() {
        return [
            nodeInputRule({
                find: takmaInputRegex,
                type: this.type,
                getAttributes: match => {
                    // match[1] contains the captured Takma link string
                    return { takmaLink: match[1] };
                },
            }),
        ];
    },

    // Use the Svelte component for rendering within the editor
    addNodeView() {
        return ({ node, editor, getPos, HTMLAttributes, decorations, extension }: NodeViewProps) => {
            // The DOM element Tiptap manages
            const dom = document.createElement(this.options.inline ? "span" : "div");
            const attrs = mergeAttributes(HTMLAttributes, { // Merge Tiptap"s HTMLAttributes with ours
                "data-takma-link": node.attrs.takmaLink, // Ensure data attribute is present for parsing
            });
            Object.entries(attrs).forEach(([key, value]) => dom.setAttribute(key, value));

            let component: SvelteComponent | null = null;
            let props = $state({
                // Pass the required prop to the Svelte component
                takmaLink: node.attrs.takmaLink,
            });

            // Check if dom still exists (might be destroyed quickly)
            if (dom)
            {
                component = mount(TakmaLink, {
                    target: dom,
                    props,
                });
            }


            return {
                dom,
                update: (updatedNode: ProseMirrorNode): boolean => {
                    // Check if the node type is still correct
                    if (updatedNode.type !== this.type) {
                        return false;
                    }

                    // Update the Svelte component's props if the attribute changed
                    if (component && node.attrs.takmaLink !== updatedNode.attrs.takmaLink) {
                        props.takmaLink = updatedNode.attrs.takmaLink;
                        // Also update the data attribute on the wrapper DOM for consistency
                        dom.setAttribute("data-takma-link", updatedNode.attrs.takmaLink);
                    }

                    // Update other HTML attributes if necessary
                    const newAttrs = mergeAttributes(HTMLAttributes, {
                        "data-takma-link": updatedNode.attrs.takmaLink,
                    });
                    // Basic diffing for attributes (could be more sophisticated)
                    Object.keys(newAttrs).forEach(key => {
                        if (dom.getAttribute(key) !== String(newAttrs[key])) {
                            dom.setAttribute(key, String(newAttrs[key]));
                        }
                    });
                    // Remove attributes that are no longer present
                    Array.from(dom.attributes).forEach(attr => {
                        if (!newAttrs.hasOwnProperty(attr.name) && attr.name !== "style")
                        {
                            dom.removeAttribute(attr.name);
                        }
                    });

                    return true;
                },
                destroy: () => {
                    component = null;
                },
            };
        };
    },

    addStorage() {
        return {
            markdown: {
                // Function to serialize this node back to markdown
                serialize(state: MarkdownSerializerState, node: ProseMirrorNode) {
                    const link = node.attrs.takmaLink;

                    if (link)
                    {
                        state.write(link);
                    }
                },
            }
        }
    },
});