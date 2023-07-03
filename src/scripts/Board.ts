export interface Board
{
    id: string, //This is actually a UUID https://developer.mozilla.org/en-US/docs/Glossary/UUID
    creationDate: number, //in milliseconds unix time
    title: string,
    backgroundImagePath: string, //path to the background image
    lists: List[] //The lists in this board
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
    labels: string[] //Each string in the array represents a hexadecimal color value, including the #
}

export interface TodoItem
{
    completed: boolean;
    content: string;
}