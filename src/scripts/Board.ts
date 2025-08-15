import {
    saveAbsoluteFilePathToSaveDirectory,
    saveAbsoluteFilePathToTempFile,
    saveFilePathToSaveDirectory,
    saveFilePathToTempFile
} from "./TakmaDataFolderIO";
import {SaveLoadManager} from "./SaveLoad/SaveLoadManager";
import {performSearchInText} from "./SearchText";

export interface Board
{
    id: string, // Unique identifier (UUID) - https://developer.mozilla.org/en-US/docs/Glossary/UUID
    creationDate: number, // Unix timestamp in milliseconds
    lastOpened: number, // Unix timestamp in milliseconds
    title: string,
    backgroundImagePath: string, // Path to the background image
    lists: List[],
    labels: Label[], // The labels in this board, which can be assigned to/are visible on cards
    favourite: boolean,
    archived: boolean,
}

export interface List
{
    id: string, // Unique identifier (UUID) - https://developer.mozilla.org/en-US/docs/Glossary/UUID
    creationDate: number, // Unix timestamp in milliseconds
    title: string,
    cards: Card[]
}

export interface Card
{
    id: string, // Unique identifier (UUID) - https://developer.mozilla.org/en-US/docs/Glossary/UUID
    creationDate: number, // Unix timestamp in milliseconds
    title: string,
    description: string,
    attachments: string[],
    coverImage: string, //The path to the cover image of this card. An empty string means this card has no cover image
    checklists: Checklist[],
    labelIds: string[], //The label ids in this array refer to ids of the labels in the board to which this card belongs to
    dueDate: string | null, //The due date of this card in unix milliseconds, null if there is no due date
    complete: boolean,
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
    creationDate: number, // Unix timestamp in milliseconds
    title: string,
    todos: TodoItem[]
}

export interface TodoItem
{
    id: string,
    completed: boolean,
    content: string
}

export type SortBoardsFunctionName = "sortByCreationDateAscending" | "sortByCreationDateDescending" | "sortByMostRecentlyOpened" | "sortByLeastRecentlyOpened" | "sortAlphabeticallyAscending" | "sortAlphabeticallyDescending" | "dontSort";

export interface WindowState
{
    width: number,
    height: number,
    fullscreen: boolean,
    x: number, //The X-coordinate of the left upper corner of the Takma window
    y: number, //The Y-coordinate of the left upper corner of the Takma window
}

export interface ShowConfirmationPreferences
{
    deleteCustomBoardBackground: boolean;
    deleteBoard: boolean;
    deleteList: boolean;
    deleteCard: boolean;
    deleteLabel: boolean;
    deleteChecklist: boolean;
    deleteAttachment: boolean;
    deleteCoverImage: boolean;
}

/**
 * Duplicates a card object
 * @param card The card object that should be duplicated
 * @param boardId The ID of the board where the duplicated card will be placed in. This is used to save the files referenced by this card to that board's directory in Takma's data folder.
 * @param filePathsAbsolute If true, the function expects that the paths to external files referenced in the card are absolute paths. If false, it assumes the paths are relative.
 * @param saveFilesToTemp If true, referenced files (attachments, cover image and local Markdown images in the card's description) will be saved in the system's temporary folder. If false, they will be saved in the board's directory. Defaults to false.
 * @returns The duplicated card
 */
export async function duplicateCard(card: Card, boardId: string, filePathsAbsolute: boolean = false, saveFilesToTemp: boolean = false): Promise<Card>
{
    card = structuredClone(card);

    card.id = crypto.randomUUID();
    card.creationDate = Date.now();

    //We need to duplicate the attachments, this way the attachments on this card wont be deleted if the user deletes attachments from the original card or vice versa
    card.attachments = await Promise.all(card.attachments.map(async attachment => {
        return await saveFilePathToSaveDirectory(attachment, boardId, attachment.getFilename().substring(36)); //We need to duplicate the attachments, this way the attachments on this card wont be deleted if the user deletes attachments from the original card or vice versa
    }));

    if (card.coverImage !== "" && !filePathsAbsolute)
    {
        card.coverImage = !saveFilesToTemp ?
            await saveFilePathToSaveDirectory(card.coverImage, boardId, card.coverImage.getFilename().substring(36)) :
            await saveFilePathToTempFile(card.coverImage, card.coverImage.getFilename().substring(36));
    }
    else if (card.coverImage !== "" && filePathsAbsolute)
    {
        card.coverImage = !saveFilesToTemp ?
            await saveAbsoluteFilePathToSaveDirectory(card.coverImage, boardId, card.coverImage.getFilename().substring(36)) :
            await saveAbsoluteFilePathToTempFile(card.coverImage, card.coverImage.getFilename().substring(36));
    }

    const imagesInCardDescription: string[] = await SaveLoadManager.getData().getAllLocalMarkdownImagesInCardDescription(card);
    const duplicatedImagesInCardDescription: string[] = await Promise.all(imagesInCardDescription.map(async imgSrc => await saveFilePathToSaveDirectory(imgSrc, boardId, imgSrc.getFilename().substring(36))));

    imagesInCardDescription.forEach((imgSrc, i) => {
        card.description = card.description.replaceAll(imgSrc, duplicatedImagesInCardDescription[i].replace(/\\/g, '/')); //Ensure the file path uses forward slashes for Markdown image links, converting any backslashes from Windows file paths.
    })

    return card;
}

/**
 * Duplicates a list object
 * @param list The list object that should be duplicated
 * @param boardId The board the duplicated list will be placed in
 * @param filePathsAbsolute If true, the function expects that the paths to external files referenced in the list are absolute paths. If false, it assumes the paths are relative.
 * @param saveFilesToTemp If true, files referenced by this list will be saved in the system's temporary folder. If false, they will be saved in the board's directory. Defaults to false.
 * @returns The duplicated list
 */
export async function duplicateList(list: List, boardId: string, filePathsAbsolute: boolean = false, saveFilesToTemp: boolean = false): Promise<List>
{
    list = structuredClone(list);

    list.id = crypto.randomUUID();
    list.creationDate = Date.now();

    list.cards = await Promise.all(list.cards.map(async card => await duplicateCard(card, boardId, filePathsAbsolute, saveFilesToTemp)));

    return list;
}

/**
 * Duplicates a board object
 * @param board The board object that should be duplicated
 * @param filePathsAbsolute If true, the function expects that the paths to external files referenced in the board are absolute paths. If false, it assumes the paths are relative.
 * @param saveFilesToTemp If true, files referenced by this board will be saved in the system's temporary folder. If false, they will be saved in the board's directory. Defaults to false.
 * @returns The duplicated board
 */
export async function duplicateBoard(board: Board, filePathsAbsolute: boolean = false, saveFilesToTemp: boolean = false): Promise<Board>
{
    board = structuredClone(board);

    board.id = crypto.randomUUID();
    board.creationDate = Date.now();
    board.lastOpened = Date.now();

    if (board.backgroundImagePath !== "" && !filePathsAbsolute)
    {
        board.backgroundImagePath = !saveFilesToTemp ?
            await saveFilePathToSaveDirectory(board.backgroundImagePath, board.id, board.backgroundImagePath.getFilename().substring(36)) :
            await saveFilePathToTempFile(board.backgroundImagePath, board.backgroundImagePath.getFilename().substring(36));
    }
    else if (board.backgroundImagePath !== "" && filePathsAbsolute)
    {
        board.backgroundImagePath = !saveFilesToTemp ?
            await saveAbsoluteFilePathToSaveDirectory(board.backgroundImagePath, board.id, board.backgroundImagePath.getFilename().substring(36)) :
            await saveAbsoluteFilePathToTempFile(board.backgroundImagePath, board.backgroundImagePath.getFilename().substring(36));
    }

    board.lists = await Promise.all(board.lists.map(async list => await duplicateList(list, board.id, filePathsAbsolute, saveFilesToTemp)));

    return board;
}

/**
 * Checks if a card contains a given string in its searchable content
 * using a flexible search strategy (exact, all-words, or fuzzy).
 *
 * @param card The Card object to search within.
 * @param searchQuery The string to search for.
 * @returns True if the string is found, false otherwise.
 */
export function cardContainsString(card: Card, searchQuery: string): boolean {
    // Gather all searchable content into a single string.
    // Concatenating fields ensures that a search for multiple unquoted words
    // (e.g., 'title word description word') can match a card where those words
    // are spread across the title, description, and checklist items.
    const searchableText = (
        card.title + ' ' +
        card.description + ' ' +
        card.checklists.map(checklist => checklist.title).join(' ') + ' ' +
        card.checklists.flatMap(checklist => checklist.todos).map(todo => todo.content).join(' ')
    ).toLowerCase();

    return performSearchInText(searchQuery, searchableText);
}

/**
 * Opens a new window to display a given card, this window doesn't allow any changes to be made to the card though. The separate window is considered a read-only view of the card.
 *
 * @param card - The card object to display in the read-only window
 */
export function openReadOnlyWindow(card: Card)
{
}