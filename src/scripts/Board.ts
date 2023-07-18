export interface Board
{
    id: string, //This is actually a UUID https://developer.mozilla.org/en-US/docs/Glossary/UUID
    creationDate: number, //in milliseconds unix time
    title: string,
    backgroundImagePath: string, //path to the background image
    lists: List[], //The lists in this board,
    labels: Label[] //The labels in this board, which can be assigned to/are visible on cards
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
    coverImageIndex: number, //The index points to an image file in the array of attachments in this card, -1 means there is no image to be used as a coverimage for this card
    todos: TodoItem[],
    labelIds: string[] //The label ids in this array refer to ids of the labels in the board to which this card belongs to
}

export interface Label
{
    id: string,
    color: string //Represents a color value which can be used in css, could be a hexidecimal color value including #, "red", rgba(100, 1, 1, 1), etc.
}

export interface TodoItem
{
    completed: boolean,
    content: string
}