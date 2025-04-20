import { Node } from '@tiptap/core';
export interface DetailsOptions {
    /**
     * Specify if the open status should be saved in the document. Defaults to `false`.
     */
    persist: boolean;
    /**
     * Specifies a CSS class that is set when toggling the content. Defaults to `is-open`.
     */
    openClassName: string;
    /**
     * Custom HTML attributes that should be added to the rendered HTML tag.
     */
    HTMLAttributes: {
        [key: string]: any;
    };
}
declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        details: {
            /**
             * Set a details node
             */
            setDetails: () => ReturnType;
            /**
             * Unset a details node
             */
            unsetDetails: () => ReturnType;
        };
    }
}
export declare const Details: Node<DetailsOptions, any>;
