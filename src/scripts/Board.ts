import {saveFilePathToDisk} from "./TakmaDataFolderIO";
import {SaveLoadManager} from "./SaveLoad/SaveLoadManager";
import {exists} from "@tauri-apps/api/fs";

export interface Board
{
    id: string, //This is actually a UUID https://developer.mozilla.org/en-US/docs/Glossary/UUID
    creationDate: number, //in milliseconds unix time
    lastOpened: number, //in milliseconds unix tim
    title: string,
    backgroundImagePath: string, //path to the background image
    lists: List[], //The lists in this board,
    labels: Label[], //The labels in this board, which can be assigned to/are visible on cards
    favourite: boolean //True if this board has been favourited by the user, else false
}

export interface List
{
    id: string, //This is actually a UUID https://developer.mozilla.org/en-US/docs/Glossary/UUID
    creationDate: number, //in milliseconds unix time
    title: string,
    cards: Card[]
}

export interface Card
{
    id: string, //This is actually a UUID https://developer.mozilla.org/en-US/docs/Glossary/UUID
    creationDate: number, //in milliseconds unix time
    title: string,
    description: string,
    attachments: string[],
    coverImage: string, //The path to the cover image of this card. An empty string means this card has no cover image
    checklists: Checklist[],
    labelIds: string[], //The label ids in this array refer to ids of the labels in the board to which this card belongs to
    dueDate: string | null //The due date of this card in unix milliseconds, null if there is no due date
}

export interface Label
{
    id: string,
    color: string //Represents a color value which can be used in css, could be a hexidecimal color value including #, "red", rgba(100, 1, 1, 1), etc.
}

export interface Checklist
{
    id: string,
    title: string,
    todos: TodoItem[]
}

export interface TodoItem
{
    id: string,
    completed: boolean,
    content: string
}

export type sortBoardsFunctionName = "sortByCreationDateAscending" | "sortByCreationDateDescending" | "sortByMostRecentlyOpened" | "sortByLeastRecentlyOpened" | "sortAlphabeticallyAscending" | "sortAlphabeticallyDescending" | "dontSort";

/**
 * Duplicates a card object
 * @param card The card object that should be duplicated
 * @param boardId The board the duplicated card will be placed in
 * @returns The duplicated card
 */
export async function duplicateCard(card: Card, boardId: string): Promise<Card>
{
    card = structuredClone(card);

    card.id = crypto.randomUUID();
    card.creationDate = Date.now();

    card.attachments = await Promise.all(card.attachments.map(async attachment => {

        if (await exists(attachment, {dir: SaveLoadManager.getSaveDirectory()}) && attachment !== "")
        {
            return await saveFilePathToDisk(await SaveLoadManager.getAbsoluteSaveDirectory() + attachment, boardId); //We need to duplicate the attachments, this way the attachments on this card wont be deleted if the user deletes attachments from the original card or vice versa
        }
        else
        {
            return "";
        }

    }));
    (card.coverImage !== "") && (card.coverImage = await saveFilePathToDisk(await SaveLoadManager.getAbsoluteSaveDirectory() + card.coverImage, boardId));

    return card;
}

/**
 * Duplicates a list object
 * @param list The list object that should be duplicated
 * @param boardId The board the duplicated list will be placed in
 * @returns The duplicated list
 */
export async function duplicateList(list: List, boardId: string): Promise<List>
{
    list = structuredClone(list);

    list.id = crypto.randomUUID();
    list.creationDate = Date.now();

    list.cards = await Promise.all(list.cards.map(async card => await duplicateCard(card, boardId)));

    return list;
}