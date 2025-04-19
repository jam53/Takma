import { Node } from '@tiptap/core';
export interface DetailsSummaryOptions {
    /**
     * Custom HTML attributes that should be added to the rendered HTML tag.
     */
    HTMLAttributes: {
        [key: string]: any;
    };
}
export declare const DetailsSummary: Node<DetailsSummaryOptions, any>;
