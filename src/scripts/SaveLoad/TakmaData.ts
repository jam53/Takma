import {SaveLoadManager} from "./SaveLoadManager";
import type {Board, Card, Label, List, sortBoardsFunctionName} from "../Board";
import {removeDir, removeFile} from "@tauri-apps/api/fs";
import {saveFilePathToDisk} from "../TakmaDataFolderIO";

/**
 * This is a "data class" that holds all the data/variables that need to be persistent between different sessions
 * + it sets the default value for these variables
 */
export class TakmaData
{
    //region data/variables
    private _darkTheme: boolean = window.matchMedia("(prefers-color-scheme: dark)").matches; //This sets the value based on the user's preferred system color theme. If the os' color theme is set to dark, this will return true. Else it will returns false
    private _cardsFullscreen: boolean = false; //Whether or not the cards should be displayed in fullscreen
    private _totalBoardsCreated: number = 0; //The total amount of boards the user has created
    private _totalListsCreated: number = 0; //The total amount of lists the user has created
    private _totalCardsCreated: number = 0; //The total amount of cards the user has created
    private _sortBoardsFunctionName: sortBoardsFunctionName = "sortByMostRecentlyOpened"; //Name of the function to be used to sort boards
    private _displayLanguage: string = navigator.language.substring(0,2); //The language Takma should be displayed in
    private _onboardingCompleted: boolean = false; //Whether or not the user has completed the onboarding process (i.e. the onboarding of the welcome screen, board screen and card details screen)
    private _easterEggBoardAdded: boolean = false; //Whether or not the easteregg board has been added to the user's savefile yet
    private _boards: Board[] = []; //The boards the user has, empty or no boards by default
    //endregion

    //region getters and setters
    /**
     * This function returns `true` if the color theme of the app is set to dark, `false` if white theme is selected
     */
    get darkTheme(): boolean
    {
        return this._darkTheme;
    }

    /**
     * This function sets whether or not the app's selected color theme is dark
     */
    set darkTheme(value: boolean)
    {
        this._darkTheme = value;
        SaveLoadManager.saveToDisk();
    }

    /**
     * This function returns `true` if cards should be displayed in fullscreen, `false` if not
     */
    get cardsFullscreen(): boolean
    {
        return this._cardsFullscreen;
    }

    /**
     * This function sets whether or not the cards should be displayed in fullscreen
     */
    set cardsFullscreen(value: boolean)
    {
        this._cardsFullscreen = value;
        SaveLoadManager.saveToDisk();
    }

    /**
     * This function increments the value of the `_totalBoardsCreated` variable by one
     */
    public incrementTotalBoardsCreated(): void
    {
        this._totalBoardsCreated++;
    }

    /**
     * This function increments the value of the `_totalListsCreated` variable by one
     */
    public incrementTotalListsCreated(): void
    {
        this._totalListsCreated++;
    }

    /**
     * This function increments the value of the `_totalCardsCreated` variable by one
     */
    public incrementTotalCardsCreated(): void
    {
        this._totalCardsCreated++;
    }

    /**
     * Returns the total amount of cards created by the user in Takma
     */
    get totalCardsCreated(): number
    {
        return this._totalCardsCreated;
    }

    /**
     * Returns the name of the function that is used to sort the boards
     */
    get sortBoardsFunctionName(): sortBoardsFunctionName
    {
        return this._sortBoardsFunctionName;
    }

    /**
     * Sets the name of the function that is used to sort the boards
     */
    set sortBoardsFunctionName(sortBoardsFunctionName: sortBoardsFunctionName)
    {
        this._sortBoardsFunctionName = sortBoardsFunctionName;
        SaveLoadManager.saveToDisk();
    }

    /**
     * Returns the display language in which Takma should be displayed
     */
    get displayLanguage(): string
    {
        return this._displayLanguage;
    }

    /**
     * Sets the display language in which Takma should be displayed
     */
    set displayLanguage(value: string)
    {
        this._displayLanguage = value;
        SaveLoadManager.saveToDisk();
    }

    /**
     * Returns true if the user has completed the onboarding process at least once, else returns false
     */
    get onboardingCompleted(): boolean
    {
        return this._onboardingCompleted;
    }

    /**
     * Sets whether or not the user has completed the onboarding process at least once
     */
    set onboardingCompleted(value: boolean)
    {
        this._onboardingCompleted = value;
        SaveLoadManager.saveToDisk();
    }

    /**
     * Returns whether or not the easter egg board has been added to the user's savefile
     */
    get easterEggBoardAdded(): boolean
    {
        return this._easterEggBoardAdded;
    }

    /**
     * Sets whether or not the easter egg board has been added to the user's savefile
     */
    set easterEggBoardAdded(value: boolean)
    {
        this._easterEggBoardAdded = value;
        SaveLoadManager.saveToDisk();
    }

    /**
     * This returns all the user's boards
     */
    get boards(): Board[]
    {
        return this._boards;
    }

    /**
     * This sets all the user's boards
     */
    set boards(boards: Board[])
    {
        this._boards = boards;
        SaveLoadManager.saveToDisk();
    }

    /**
     * Given an id, this will return a board
     */
    public getBoard(id: string): Board
    {
        return this._boards.find(board => board.id === id);
    }

    /**
     * Creates a new Board
     * @param title title of the board
     * @param backgroundImagePath path to the background image of the board. This should be the path the user picked, not the path obtained after saving the file to Takma's "Files" data folder. We save to the "Files" data folder in this function
     * @returns id of the created board
     */
    public async createNewBoard(title: string, backgroundImagePath: string): Promise<string>
    {
        let boardId = crypto.randomUUID();

        let board: Board = {
            id: boardId,
            creationDate: Date.now(),
            lastOpened: Date.now(),
            backgroundImagePath: await saveFilePathToDisk(backgroundImagePath, boardId),
            title: title,
            labels: [],
            lists: []
        };

        this._boards.push(board);
        this.incrementTotalBoardsCreated();
        await SaveLoadManager.saveToDisk();

        return boardId;
    }

    /**
     * Sets a board's title
     */
    public setBoardTitle(id: string, title: string): void
    {
        const indexOfBoard = this._boards.findIndex(board => board.id === id);

        this._boards[indexOfBoard].title = title;
        SaveLoadManager.saveToDisk();
    }

    /**
     * Deletes a board
     */
    public async deleteBoard(id: string): Promise<void>
    {
        this._boards = this.boards.filter(board => board.id != id);
        await SaveLoadManager.saveToDisk();

        await removeDir(`./Takma/Files/${id}/`, {dir: SaveLoadManager.getSaveDirectory(), recursive: true});
    }

    /**
     * Sets the background image of a board
     * @param id id of the board whose background image will be changed
     * @param pathToImage
     */
    public setBoardBackgroundImage(id: string, pathToImage: string): void
    {
        const indexOfBoard = this._boards.findIndex(board => board.id === id);

        this._boards[indexOfBoard].backgroundImagePath = pathToImage;
        SaveLoadManager.saveToDisk();
    }

    /**
     * Creates a new List within a board
     * @param boardId id of the board to which the list should be added
     * @param listTitle title of the list to be added
     * @param cards optional argument, if not passed a list with an empty card array will be created
     * @param indexToInsert optional argument, will create a list at a certain index, if not passed the list will be added to the end of the array of lists
     */
    public createNewList(boardId: string, listTitle: string, cards?: Card[], indexToInsert?: number): string
    {

        let list: List = {
            id: crypto.randomUUID(),
            creationDate: Date.now(),
            title: listTitle,
            cards: cards ?? []
        };

        const indexOfBoard = this._boards.findIndex(board => board.id === boardId);

        if (indexToInsert != undefined)
        {
            this._boards[indexOfBoard].lists.splice(indexToInsert, 0, list);
        }
        else
        {
            this._boards[indexOfBoard].lists.push(list);
        }

        this.incrementTotalListsCreated();
        SaveLoadManager.saveToDisk();
        return list.id;
    }

    /**
     * Given an id of a board and an id of a list within that board, this function will return a List
     */
    public getList(boardId: string, listId: string): List
    {
        let board: Board = this._boards.find(board => board.id === boardId);
        let list: List = board.lists.find(list => list.id === listId);

        let emptyList: List = {
            id: "empty list",
            creationDate: 0,
            title: "",
            cards: []
        };

        return list ? list : emptyList;
    }

    /**
     * Given an id of a board and a list of `List`'s this function sets a board's lists
     */
    public setLists(boardId: string, lists: List[]): void
    {
        const indexOfBoard = this._boards.findIndex(board => board.id === boardId);
        this._boards[indexOfBoard].lists = lists;

        SaveLoadManager.saveToDisk();
    }

    /**
     * Creates a new Card within a list, in a board
     * @param cardTitle title of the card to be added
     * @param boardId id of the board that contains the list
     * @param listId id of the list to which the card should be added
     */
    public createNewCard(cardTitle: string, boardId: string, listId: string): string
    {
        const indexOfBoard = this._boards.findIndex(board => board.id === boardId);
        const indexOfList = this._boards[indexOfBoard].lists.findIndex(list => list.id === listId);

        let card: Card = {
            id: crypto.randomUUID(),
            creationDate: Date.now(),
            title: cardTitle,
            description: "",
            attachments: [],
            coverImage: "",
            checklists: [],
            labelIds: [],
            dueDate: null
        };

        this._boards[indexOfBoard].lists[indexOfList].cards.push(card);
        this.incrementTotalCardsCreated();
        SaveLoadManager.saveToDisk();

        return card.id;
    }

    /**
     * Sets a list's title
     */
    public setListTitle(title: string, boardId: string, listId: string): void
    {
        const indexOfBoard = this._boards.findIndex(board => board.id === boardId);
        const indexOfList = this._boards[indexOfBoard].lists.findIndex(list => list.id === listId);

        this._boards[indexOfBoard].lists[indexOfList].title = title;
        SaveLoadManager.saveToDisk();
    }

    /**
     * Deletes a list
     */
    public deleteList(boardId: string, listId: string): void
    {
        const indexOfBoard = this._boards.findIndex(board => board.id === boardId);
        const listIndexToDelete = this._boards[indexOfBoard].lists.findIndex(list => list.id === listId);

        let deletedList = this._boards[indexOfBoard].lists.splice(listIndexToDelete, 1);

        SaveLoadManager.saveToDisk();

        deletedList[0].cards.forEach(card => this.deleteAllFilesTiedToCard(card));
    }

    /**
     * Deletes all the files on disk associated with this card
     */
    private deleteAllFilesTiedToCard(card: Card)
    {
        card.attachments.forEach(async attachment =>
        {
            await removeFile(attachment, {dir: SaveLoadManager.getSaveDirectory()})
        });

        if (card.coverImage !== "")
        {
            removeFile(card.coverImage, {dir: SaveLoadManager.getSaveDirectory()});
        }
    }

    /**
     * Deletes a card
     */
    public deleteCard(boardId: string, cardId: string): void
    {
        const indexOfBoard: number = this._boards.findIndex(board => board.id === boardId);
        let indexOfList: number;
        let indexOfCardToDelete: number;


        for (let i = 0; i < this._boards[indexOfBoard].lists.length; i++)
        {
            for (let j = 0; j < this._boards[indexOfBoard].lists[i].cards.length; j++)
            {
                if (this._boards[indexOfBoard].lists[i].cards[j].id === cardId)
                {
                    indexOfList = i;
                    indexOfCardToDelete = j;
                    break;
                }
            }
        }

        const deletedCard: Card[] = this._boards[indexOfBoard].lists[indexOfList].cards.splice(indexOfCardToDelete, 1);

        SaveLoadManager.saveToDisk();

        this.deleteAllFilesTiedToCard(deletedCard[0]);
    }

    /**
     * Updates the content of a specific list
     */
    public updateList(boardId: string, listId: string, newListContent: List)
    {
        const indexOfBoard = this._boards.findIndex(board => board.id === boardId);
        const listIndexToReplace = this._boards[indexOfBoard].lists.findIndex(list => list.id === listId);

        this._boards[indexOfBoard].lists[listIndexToReplace] = newListContent;

        SaveLoadManager.saveToDisk();
    }

    /**
     * Given an id of a board, an id of a list within that board, and an id of card in that list, this function will return a card
     */
    public getCard(boardId: string, cardId: string): Card|null
    {
        let board: Board = this._boards.find(board => board.id === boardId);

        for (const list of board.lists)
        {
            for (const card of list.cards)
            {
                if (card.id === cardId)
                {
                    return card;
                }
            }
        }

        return null;
    }

    /**
     * Updates the content of a specific card
     */
    public updateCard(card: Card, boardId: string, cardId: string): void
    {
        const indexOfBoard = this._boards.findIndex(board => board.id === boardId);
        let currentList: List;

        for (let indexOfList = 0; indexOfList < this._boards[indexOfBoard].lists.length; indexOfList++)
        {
            currentList = this._boards[indexOfBoard].lists[indexOfList];

            for (let indexOfCard = 0; indexOfCard < currentList.cards.length; indexOfCard++)
            {
                if (currentList.cards[indexOfCard].id === cardId)
                {
                    this._boards[indexOfBoard].lists[indexOfList].cards[indexOfCard] = card;

                    SaveLoadManager.saveToDisk();
                    return;
                }
            }
        }
    }

    /**
     * Given a labelId, returns the color matching that labelId
     * @return Represents a color value which can be used in css, could be a hexidecimal color value including #, "red", rgba(100, 1, 1, 1), etc.
     */
    public getLabelColor(boardId: string, labelId: string): string
    {
        let board: Board = this._boards.find(board => board.id === boardId);

        return board.labels.find(label => label.id === labelId).color;
    }

    /**
     * Adds a label to a board
     */
    public addLabelToBoard(boardId: string, label: Label)
    {
        const indexOfBoard = this._boards.findIndex(board => board.id === boardId);

        this._boards[indexOfBoard].labels.push(label)

        SaveLoadManager.saveToDisk();
    }

    /**
     * Changes the color of a label in a board
     */
    public editLabelColor(boardId: string, labelId: string, labelColor: string)
    {
        const indexOfBoard = this._boards.findIndex(board => board.id === boardId);
        const indexOfLabel = this._boards[indexOfBoard].labels.findIndex(label => label.id === labelId);

        this._boards[indexOfBoard].labels[indexOfLabel].color = labelColor;

        SaveLoadManager.saveToDisk();
    }

    /**
     * Removes a label from a board and from all the cards in that board
     */
    public removeLabel(boardId: string, labelId: string)
    {
        const indexOfBoard = this._boards.findIndex(board => board.id === boardId);
        const indexOfLabelInBoard = this._boards[indexOfBoard].labels.findIndex(label => label.id === labelId);

        this._boards[indexOfBoard].labels.splice(indexOfLabelInBoard, 1);


        let currentList: List;
        let currentCard: Card;
        for (let indexOfList = 0; indexOfList < this._boards[indexOfBoard].lists.length; indexOfList++)
        {
            currentList = this._boards[indexOfBoard].lists[indexOfList];

            for (let indexOfCard = 0; indexOfCard < currentList.cards.length; indexOfCard++)
            {
                currentCard = currentList.cards[indexOfCard];

                for (let indexOfLabelId = 0; indexOfLabelId < currentCard.labelIds.length; indexOfLabelId++)
                {
                    if (currentCard.labelIds[indexOfLabelId] === labelId)
                    {
                        this._boards[indexOfBoard].lists[indexOfList].cards[indexOfCard].labelIds.splice(indexOfLabelId, 1);
                    }
                }
            }
        }


        SaveLoadManager.saveToDisk();
    }

    /**
     * Updates the lastOpened field of the board with the current time or the time passed as an argument
     */
    public setBoardLastOpenedTime(boardId: string, lastOpenedTime: number = Date.now())
    {
        const indexOfBoard = this._boards.findIndex(board => board.id === boardId);

        this._boards[indexOfBoard].lastOpened = lastOpenedTime;

        SaveLoadManager.saveToDisk();
    }
    //endregion
}