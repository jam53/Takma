export interface Board
{
    id: string, //This is actually a UUID https://developer.mozilla.org/en-US/docs/Glossary/UUID
    creationDate: number, //in milliseconds unix time
    title: string,
    backgroundImagePath: string //path to the background image
}