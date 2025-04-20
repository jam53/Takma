import { Node } from '@tiptap/core';
export interface DetailsContentOptions {
    /**
     * Custom HTML attributes that should be added to the rendered HTML tag.
     */
    HTMLAttributes: {
        [key: string]: any;
    };
}
export declare const DetailsContent: Node<DetailsContentOptions, any>;
