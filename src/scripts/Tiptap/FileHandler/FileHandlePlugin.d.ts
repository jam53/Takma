import { Plugin } from '@tiptap/pm/state';
import { FileHandlePluginOptions } from './types';
export declare const FileHandlePlugin: ({ key, editor, onPaste, onDrop, allowedMimeTypes, }: FileHandlePluginOptions) => Plugin<any>;
