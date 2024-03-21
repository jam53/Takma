import {saveArrayBufferToDisk, saveFilePathToDisk} from "./TakmaDataFolderIO";
import {SaveLoadManager} from "./SaveLoad/SaveLoadManager";
import {exists, readBinaryFile} from "@tauri-apps/api/fs";

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

/**
 * We use this interface to implement the copy/paste card feature.
 *
 * We couldn't just duplicate the card we wanted to copy to then paste it later. This is because should the user copy the card but then never paste it, we would have created new files for the attachments/cover image on disk that are no longer being referenced by any card in the board.
 * Neither could we just keep a reference (the card ID) to the card that we wanted to copy, to then duplicated that referenced card the moment we wanted to paste. Because what if the user copied the card, and then deleted it first before pasting it.
 *
 * So instead I opted for this approach using a new interface. First we strip the attachments and cover image from the card we want to copy, should it have any. Then we duplicate the card and store it in `cardWithoutAttachmentsAndCoverImage`. The attachments and cover image that we stripped away will be read from disk and stored as byte arrays (Uint8Array).
 * The moment we wish to paste the copied card, we will first save the attachments and cover image that are byte arrays to disk using `TakmaDataFolderIO.saveArrayBufferToDisk()`. Then we can use together with `cardWithoutAttachmentsAndCoverImage` and paste the new card.
 */
export interface CopiedCard //A CopiedCard can be seen as a Card that doesn't reference any values, but is self-contained
{
    cardWithoutAttachmentsAndCoverImage: Card,
    attachments: {fileName: string, byteArray: Uint8Array}[],
    coverImage: {fileName: string, byteArray: Uint8Array} | null,
    labelsCardRefersTo: Label[] //A card references the ids of labels in its board, should we however paste this copied card in another board we will no longer be able to resolve those references. Therefore, we should keep the referenced labels by this card in this CopiedCard
}

export interface CopiedList
{
    listWithoutCards: List,
    copiedCards: CopiedCard[]
}

export interface Label
{
    id: string,
    color: string, //Represents a color value which can be used in css, could be a hexidecimal color value including #, "red", rgba(100, 1, 1, 1), etc.
    title: string,
    titleColor: string //This color is calculated and set through code based on the color of this label. The user themselves can't set this value
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

/**
 * Given a `Card`, duplicates it and returns it as a `CopiedCard`
 * @param card The card you wish to duplicate
 * @param boardId The id of the board the Card that is going to be duplicated is in
 */
export async function duplicateCardAsCopiedCard(card: Card, boardId: string): Promise<CopiedCard>
{
    card = structuredClone(card); //To make sure we no longer hold any references to `attachments` array of the original card we will delete here.

    let attachments = await Promise.all(card!.attachments.map(async attachment => {
        if (await exists(attachment, {dir: SaveLoadManager.getSaveDirectory()}) && attachment !== "")
        {
            return {
                fileName: attachment.split('\\').pop().split('/').pop().substring(36) ?? "",
                byteArray: await readBinaryFile(await SaveLoadManager.getAbsoluteSaveDirectory() + attachment)
            };
        }
        else
        {
            return null;
        }
    }).filter(async attachment => await attachment !== null));
    let coverImage = card!.coverImage !== "" ? {fileName: card!.coverImage.split('\\').pop().split('/').pop().substring(36) ?? "", byteArray: await readBinaryFile(await SaveLoadManager.getAbsoluteSaveDirectory() + card!.coverImage)} : null;

    card!.attachments = [];
    card!.coverImage = "";

    return {
        cardWithoutAttachmentsAndCoverImage: await duplicateCard(card!, ""), //You could argue that we pass an incorrect value to the boardId parameter. However, since the boardId parameter in this function is only used when duplicating the attachments/coverImage it doesn't matter, since we duplicate those ourselves in this case.
        attachments: attachments as {fileName: string, byteArray: Uint8Array}[],
        coverImage: coverImage,
        labelsCardRefersTo: card.labelIds.map(labelId => ({id: labelId, color: SaveLoadManager.getData().getLabelColor(boardId, labelId), title: SaveLoadManager.getData().getLabelTitle(boardId, labelId), titleColor: SaveLoadManager.getData().getLabelTitleColor(boardId, labelId)}))
    }
}

/**
 * Given a `CopiedCard`, duplicates it and returns it as a `Card`
 * @param copiedCard The copiedCard you wish to duplicate
 * @param boardId The id of the board the returned Card will be used in
 */
export async function duplicateCopiedCardAsCard(copiedCard: CopiedCard, boardId: string): Promise<Card>
{
    let card = await duplicateCard(copiedCard.cardWithoutAttachmentsAndCoverImage, boardId);

    card.attachments = await Promise.all(copiedCard.attachments.map(attachment => saveArrayBufferToDisk(attachment.byteArray, crypto.randomUUID() + attachment.fileName, boardId)));

    card.coverImage = copiedCard.coverImage !== null ? await saveArrayBufferToDisk(copiedCard.coverImage.byteArray, crypto.randomUUID() + copiedCard.coverImage.fileName, boardId) : "";

    copiedCard.labelsCardRefersTo.forEach(label => {
        if (!SaveLoadManager.getData().getBoard(boardId).labels.some(labelInBoard => labelInBoard.id === label.id))
        {
            SaveLoadManager.getData().addLabelToBoard(boardId, label);
        }
    });

    return card;
}