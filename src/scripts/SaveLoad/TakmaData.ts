import {SaveLoadManager} from "./SaveLoadManager";
import type {Board, Card, Label, List, sortBoardsFunctionName, windowState} from "../Board";
import {saveAbsoluteFilePathToSaveDirectory} from "../TakmaDataFolderIO";

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
    private _sortBoardsFunctionName: SortBoardsFunctionName = "sortByMostRecentlyOpened"; //Name of the function to be used to sort boards
    private _displayLanguage: string = localStorage.getItem("displayLanguage") ?? navigator.language.substring(0,2); //The language Takma should be displayed in
    private _onboardingCompleted: boolean = false; //Whether or not the user has completed the onboarding process (i.e. the onboarding of the welcome screen, board screen and card details screen)
    private _easterEggBoardAdded: boolean = false; //Whether or not the easteregg board has been added to the user's savefile yet
    private _showLabelsText: boolean = true; //Whether or not the labels of cards on the boardscreen should display their text. When false only the color will be shown
    private _windowState: WindowState = {
        width: 1200,
        height: 700,
        fullscreen: true,
        x: 200,
        y: 200,
    }; //Used to save and restore the state of the Takma window. E.g. whether or not it was full screen, the window size and so on
    private _showConfirmationPreferences: ShowConfirmationPreferences = {
        deleteCustomBoardBackground: true,
        deleteBoard: true,
        deleteList: true,
        deleteCard: true,
        deleteLabel: true,
        deleteChecklist: true,
        deleteAttachment: true,
        deleteCoverImage: true,
    }; // Tracks user preference to show or hide specific confirmation popups. `true` (default) means show the popup. `false` means the user has opted out e.g. when the user checked "Don't show this again"
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
        debug("Toggle dark theme preference to: " + value);
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
        debug("Toggle card fullscreen preference to: " + value);
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
    get sortBoardsFunctionName(): SortBoardsFunctionName
    {
        return this._sortBoardsFunctionName;
    }

    /**
     * Sets the name of the function that is used to sort the boards
     */
    set sortBoardsFunctionName(sortBoardsFunctionName: SortBoardsFunctionName)
    {
        debug("Change boards sort order to: " + sortBoardsFunctionName);
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
    public async setDisplayLanguage(value: string)
    {
        await debug("Set display language to: " + value);
        this._displayLanguage = value;
        await SaveLoadManager.saveToDisk();
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
     * Returns whether or not the labels on the boardscreen should display their title if they have one, or only the color
     */
    get showLabelsText(): boolean
    {
        return this._showLabelsText;
    }

    /**
     * Sets whether or not the labels on the boardscreen should display their title if they have one, or only the color
     */
    set showLabelsText(value: boolean)
    {
        debug("Toggle show labels text preference to: " + value);
        this._showLabelsText = value;
        SaveLoadManager.saveToDisk();
    }

    /**
     * Returns the last saved window state
     */
    get windowState(): WindowState
    {
        return this._windowState ;
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
        debug("Replacing all existing boards");
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
     * @param saveBackgroundImageToDisk optional argument, whether or not the path to the background image should be saved to disk or not, true by default
     * @param id optional argument, creates a new board with the specified id, if not passed a random id is created
     * @param labels optional argument, if not passed a board with an empty label array will be created
     * @param lists optional argument, if not passed a board with an empty list array will be created
     * @param favourite optiona argument, whether or not this board should be marked as a favourite board, false by default
     * @param indexToInsert optional argument, will create a board at a certain index, if not passed the board will be added to the end of the array of boards
     * @returns id of the created board
     */
    public async createNewBoard(title: string, backgroundImagePath: string, saveBackgroundImageToDisk?: boolean, id?: string, labels?: Label[], lists?: List[], favourite?: boolean, indexToInsert?: number): Promise<string>
    {
        let boardId = id ?? crypto.randomUUID();

        let board: Board = {
            id: boardId,
            creationDate: Date.now(),
            lastOpened: Date.now(),
            backgroundImagePath: saveBackgroundImageToDisk === undefined || saveBackgroundImageToDisk ? await saveAbsoluteFilePathToSaveDirectory(backgroundImagePath, boardId) : backgroundImagePath,
            title: title,
            labels: labels ?? [],
            lists: lists ?? [],
            favourite: favourite ?? false
        };

        if (indexToInsert != undefined)
        {
            this._boards.splice(indexToInsert, 0, board);
        }
        else
        {
            this._boards.push(board);
        }

        this.incrementTotalBoardsCreated();
        await SaveLoadManager.saveToDisk();

        await debug("Created new board: " + board.id);
        return boardId;
    }

    /**
     * Sets a board's title
     */
    public setBoardTitle(id: string, title: string): void
    {
        debug(`Set title of board:${id} to "${title}"`);
        const indexOfBoard = this._boards.findIndex(board => board.id === id);

        this._boards[indexOfBoard].title = title;
        SaveLoadManager.saveToDisk();
    }

    /**
     * Deletes a board
     */
    public async deleteBoard(id: string): Promise<void>
    {
        debug("Delete board:" + id);
        this._boards = this.boards.filter(board => board.id != id);
        await SaveLoadManager.saveToDisk();
    }

    /**
     * Sets the background image of a board
     * @param id id of the board whose background image will be changed
     * @param pathToImage
     */
    public setBoardBackgroundImage(id: string, pathToImage: string): void
    {
        debug(`Set background image of board:${id} to "${pathToImage}"`);
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
        debug(`Created new list: ${list.id} with ${list.cards.length} cards`);
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
     * Returns a list given an id of a card that is in the list and the id of the board that contains the list.
     */
    public getListContainingCard(boardId: string, cardId: string): List
    {
        let emptyList: List = {
            id: "empty list",
            creationDate: 0,
            title: "",
            cards: []
        };

        return this.getBoard(boardId).lists.find(list => list.cards.some(card => card.id === cardId)) ?? emptyList;
    }

    /**
     * Given an id of a board and a list of `List`'s this function sets a board's lists
     */
    public setLists(boardId: string, lists: List[]): void
    {
        debug("Replacing all lists for board: " + boardId);
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
            dueDate: null,
            complete: false,
        };

        this._boards[indexOfBoard].lists[indexOfList].cards.push(card);
        this.incrementTotalCardsCreated();
        SaveLoadManager.saveToDisk();

        debug("Created new card: " + card.id);
        return card.id;
    }

    /**
     * Sets a list's title
     */
    public setListTitle(title: string, boardId: string, listId: string): void
    {
        debug(`Setting list title "${title}" for list:${listId} in board:${boardId}`);
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
        debug(`Deleting list:${listId} in board:${boardId}`);
        const indexOfBoard = this._boards.findIndex(board => board.id === boardId);
        const listIndexToDelete = this._boards[indexOfBoard].lists.findIndex(list => list.id === listId);

        let deletedList = this._boards[indexOfBoard].lists.splice(listIndexToDelete, 1);

        SaveLoadManager.saveToDisk();
    }

    /**
     * Deletes a card
     */
    public deleteCard(boardId: string, cardId: string): void
    {
        debug(`Deleting card:${cardId} in board:${boardId}`);
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

        const deletedCard: Card = this._boards[indexOfBoard].lists[indexOfList].cards.splice(indexOfCardToDelete, 1)[0];

        SaveLoadManager.saveToDisk();
    }

    /**
     * Updates the content of a specific list
     */
    public updateList(boardId: string, listId: string, newListContent: List)
    {
        debug(`Replacing list: ${listId} in board: ${boardId} with list: ${newListContent.id}`);
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
        debug(`Retrieving card:${cardId} in board:${boardId}`);
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
        if (boardId === "" || cardId === "" || card.id !== cardId)
        {
            return;
        }

        debug(`Replacing card: ${cardId} in board: ${boardId} with: ${card.id}`);
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
     * Given a labelId, returns the label with that labelId
     */
    public getLabel(boardId: string, labelId: string): Label
    {
        debug(`Getting label:${labelId} in board:${boardId}`);
        let board: Board = this._boards.find(board => board.id === boardId);

        return board.labels.find(label => label.id === labelId);
    }

    /**
     * Adds a label to a board
     */
    public addLabelToBoard(boardId: string, label: Label)
    {
        debug(`Adding label: ${label.id} to board: ${boardId}`);
        const indexOfBoard = this._boards.findIndex(board => board.id === boardId);

        this._boards[indexOfBoard].labels.push(label)

        SaveLoadManager.saveToDisk();
    }

    /**
     * Sets the title of a label in a board
     */
    public setLabelTitle(boardId: string, labelId: string, title: string)
    {
        debug(`Setting title of label: ${labelId} in board: ${boardId} to "${title}"`);
        const indexOfBoard = this._boards.findIndex(board => board.id === boardId);
        const indexOfLabel = this._boards[indexOfBoard].labels.findIndex(label => label.id === labelId);

        this._boards[indexOfBoard].labels[indexOfLabel].title = title;

        SaveLoadManager.saveToDisk();
    }

    /**
     * Changes the color of a label and the color of the label's title in a board
     */
    public editLabelColor(boardId: string, labelId: string, labelColor: string, labelTitleColor: string)
    {
        debug(`Editing label:${labelId} in board:${boardId}, replacing label color "${labelColor}" and label title color "${labelTitleColor}"`);
        const indexOfBoard = this._boards.findIndex(board => board.id === boardId);
        const indexOfLabel = this._boards[indexOfBoard].labels.findIndex(label => label.id === labelId);

        this._boards[indexOfBoard].labels[indexOfLabel].color = labelColor;
        this._boards[indexOfBoard].labels[indexOfLabel].titleColor = labelTitleColor;

        SaveLoadManager.saveToDisk();
    }

    /**
     * Removes a label from a board and from all the cards in that board
     */
    public removeLabel(boardId: string, labelId: string)
    {
        debug(`Removing label:${labelId} from board:${boardId}`);
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
        debug(`Setting last opened timed of board:${boardId} to "${lastOpenedTime}"`);
        const indexOfBoard = this._boards.findIndex(board => board.id === boardId);

        this._boards[indexOfBoard].lastOpened = lastOpenedTime;

        SaveLoadManager.saveToDisk();
    }

    /**
     * Toggles whether or not this board is favourited
     */
    public toggleBoardFavourity(boardId: string)
    {
        debug(`Toggling the favourite preference for board:${boardId}`);
        const indexOfBoard = this._boards.findIndex(board => board.id === boardId);
        this._boards[indexOfBoard].favourite = !this._boards[indexOfBoard].favourite;

        SaveLoadManager.saveToDisk();
    }

    /**
     * Adds a card to a list
     * @param card the card object that will be added
     * @param boardId id of the board that contains the list to which the card should be added
     * @param listId id of the list to which the card should be added
     * @param indexToInsert optional argument, will add the card at a certain index in the list, if not passed the card will be added to the end of the array of cards
     */
    public addCardToList(card: Card, boardId: string, listId: string, indexToInsert: number = -1): void
    {
        debug(`Inserting card: ${card.id} into list: ${listId} in board: ${boardId} at position ${indexToInsert}`);
        const indexOfBoard = this._boards.findIndex(board => board.id === boardId);
        const indexOfList = this._boards[indexOfBoard].lists.findIndex(list => list.id === listId);

        this._boards[indexOfBoard].lists[indexOfList].cards.splice(indexToInsert, 0, card);

        this.incrementTotalCardsCreated();
        SaveLoadManager.saveToDisk();
    }

    /**
     * Sets the x and y coordinates of the window state
     */
    public setWindowStatePosition(x: number, y:number)
    {
        this._windowState.x = x;
        this._windowState.y = y;

        // SaveLoadManager.saveToDisk(); //We aren't saving on purpose, otherwise it becomes really laggy when resizing/dragging the window. These changes will be saved to disk, the next time another function changes some state and calls `SaveLoadManager.saveToDisk()`
    }

    /**
     * Sets the size and fullscreen variables of the window state
     */
    public setWindowStateSize(width: number, height:number, fullscreen: boolean)
    {
        this._windowState.width = width;
        this._windowState.height = height;
        this._windowState.fullscreen = fullscreen;

        // SaveLoadManager.saveToDisk(); //We aren't saving on purpose, otherwise it becomes really laggy when resizing/dragging the window. These changes will be saved to disk, the next time another function changes some state and calls `SaveLoadManager.saveToDisk()`
    }

    /**
     * Returns a list of filenames of all the files related to this board. These could be attachments of cards, cover images of cards or the board's background image
     */
    public async getAllFilesRelatedToBoard(boardId: string): Promise<string[]>
    {
        debug(`Retrieving all files tied to board:${boardId}`);
        let files: string[] = [];

        const board = this.getBoard(boardId);
        files.push(board.backgroundImagePath.getFilename());

        for (let list of board.lists)
        {
            for (let card of list.cards)
            {
                files.push(...card.attachments.map(attachment => attachment.getFilename()));
                files.push(card.coverImage.getFilename());
                files.push(...(await this.getAllLocalMarkdownImagesInCardDescription(card)).map(img => img.getFilename()));
            }
        }

        return files;
    }

    /**
     * Extracts all local image file paths referenced in the description of a given card.
     * The function searches for Markdown image links (e.g., ![alt text](path/to/image)) within the card's description
     * and returns an array of distinct paths to the images.
     *
     * @param card - The Card object containing the description with potential Markdown image links.
     * @returns A unique array of strings, where each string is a path to a local image file referenced in the card's description.
     */
    public async getAllLocalMarkdownImagesInCardDescription(card: Card): Promise<string[]>
    {
        const markdownImageLinkRegex = /!\[[^\]]*\]\((?<imgSrc>.*?)(?=\"|\))(?<optionalpart>\".*\")?\)/g; //https://stackoverflow.com/questions/44227270/regex-to-parse-image-link-in-markdown
        //This regex only matches image links with forward slashes, so we have to make sure that all image links in a card's description use forward slashes.

        const tempDirPath = (await SaveLoadManager.getTempDirectoryPath()).replace(/\\/g, '/'); //Since the path will be compared to Markdown image links, which are formatted using forward slashes. Ensure the file path uses forward slashes, converting any backslashes from Windows file paths.

        return [... new Set( //This ensures that if multiple ![]() markdown images refer to the same URL/file, each URL appears only once in the array
            [...card.description.matchAll(markdownImageLinkRegex)]
                .map(match => match.groups?.imgSrc).filter(imgSrc => imgSrc !== undefined)
        )].filter(imgSrc => imgSrc.startsWith(SaveLoadManager.getBoardFilesDirectory()) || imgSrc.startsWith(tempDirPath)); //We only want to retain images that are stored in locations managed by Takma. I.e. Takma's save directory or Takma's temporary folder, not paths to image files somewhere else on disk nor http/https urls to images
    }

    /**
     * Get the user's preferences for showing confirmation popups before destructive actions
     */
    get showConfirmationPreferences(): ShowConfirmationPreferences
    {
        return this._showConfirmationPreferences;
    }

    /**
     * Updates a specific confirmation preference and saves the changes.
     * @param key - The preference key to update (e.g., "deleteBoard").
     * @param value - The new boolean value for the preference.
     */
    public async updateConfirmationPreference(key: keyof ShowConfirmationPreferences, value: boolean): Promise<void> {
        this._showConfirmationPreferences[key] = value;
        await SaveLoadManager.saveToDisk();
    }

    /**
     * Reconciles a list of incoming labels (`newLabels`, typically from a copied item)
     * with the existing labels on a target board (`boardId`). Adds labels to the target
     * board if necessary, handling duplicates and conflicts based on both ID and content
     * (title, titleColor, color).
     *
     * Priority Logic:
     * 1. Content Match (Different ID): Reuse existing label, map incoming ID -> existing ID. **Do NOT add.**
     * 2. ID Match (Different Content): Conflict. Add incoming label with a NEW unique ID, map incoming ID -> new unique ID. **DO add.**
     * 3. No Match (Different ID, Different Content): New label. Add incoming label with its original ID. **DO add.**
     * 4. Exact Match (Same ID, Same Content): Do nothing.
     *
     * @param boardId The ID of the target board where labels should be checked/added.
     * @param newLabels An array of Label objects representing the labels associated with the item being pasted.
     * @returns A Map where keys are the *original* label IDs from `newLabels` that needed remapping,
     *          and values are the *new* label IDs they should map to on the target board.
     *          This map contains entries for cases 1 and 2 above.
     */
    public createMissingLabelsInBoard(boardId: string, newLabels: Label[]): Map<string, string>
    {
        // Map to store required ID updates: { originalId => targetBoardId }
        const updatedLabelIds = new Map<string, string>();
        const existingLabels = SaveLoadManager.getData().getBoard(boardId).labels;

        newLabels.forEach(newLabel => {
            const existingLabelById = existingLabels.find(el => el.id === newLabel.id);
            const existingLabelByContent = existingLabels.find(el =>
                el.title === newLabel.title &&
                el.titleColor === newLabel.titleColor &&
                el.color === newLabel.color
            );

            // Case 1: Content Match exists, AND it's either a different ID or no ID match was found.
            if (existingLabelByContent && (!existingLabelById || existingLabelById.id !== existingLabelByContent.id))
            {
                updatedLabelIds.set(newLabel.id, existingLabelByContent.id); // Use the existing label's ID. DO NOT add the newLabel.
            }
            // Case 2: ID Match exists, AND the content is different (or no exact content match found).
            else if (existingLabelById && (!existingLabelByContent || existingLabelById.id !== existingLabelByContent.id))
            {
                const generatedId = crypto.randomUUID();
                updatedLabelIds.set(newLabel.id, generatedId);

                SaveLoadManager.getData().addLabelToBoard(boardId, { ...newLabel, id: generatedId }); // Add the label with a new ID
            }
            // Case 3: No match by ID, no match by content. Truly new label.
            else if (!existingLabelById && !existingLabelByContent)
            {
                SaveLoadManager.getData().addLabelToBoard(boardId, newLabel); // Add the label with its original ID
            }
            // Implicit Else: Case 4 (existingLabelById && existingLabelByContent && existingLabelById.id === existingLabelByContent.id)
            // Action: Exact match exists (same ID, same content). Do nothing.
        });

        SaveLoadManager.saveToDisk();
        return updatedLabelIds;
    }

    /**
     * Checks if the user is on a mobile device by analyzing the user agent string.
     *
     * @returns {boolean} - Returns true if the user is on a mobile device, false otherwise.
     */
    public isUserOnMobile(): boolean
    {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;

        // Regular expression to match various mobile devices from http://detectmobilebrowsers.com/
        return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(userAgent) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(userAgent.substr(0, 4));
    }
    //endregion
}