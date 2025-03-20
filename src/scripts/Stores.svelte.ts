import type {Board, Card, List} from "./Board";
import {SaveLoadManager} from "./SaveLoad/SaveLoadManager";

export const selectedBoardId: { value: string } = $state({value: ""}); //When a board is selected/being displayed this holds that board's id. When we are on the welcome screen, i.e. when there is no board selected this is an empty string
export const selectedCardId: { value: string } = $state({value: ""}); //When a card is selected/being displayed this holds that card's id. When there is no card selected this will be an empty string.
export const searchBarValue: { value: string } = $state({value: ""}); //This contains the value of the searchbar
export const cardFilters: { labelIds: string[], dueDate: number, complete: boolean, incomplete: boolean } = $state({labelIds: [], dueDate: Number.MAX_SAFE_INTEGER, complete: false, incomplete: false}) //The board screen will filter the cards based on these values.
export const dueDatesOverviewPopupIsVisible: { value: boolean } = $state({value: false}); //True if the DueDatesOverviewPopup is being shown else false.
export const copiedCard: { value: Card | null } = $state({value: null}); //Contains either `null` or a `Card`. `null` means the user hasn't copied anything yet, a `Card` value means the user copied a card, which can be pasted within any list, even in other boards.
export const copiedList: { value: List | null } = $state({value: null}); //Contains either `null` or a `List`. `null` means the user hasn't copied anything yet, a `List` value means the user copied a list, which can be pasted within any board.
export const copiedBoard: { value: Board | null } = $state({value: null}); //Contains either `null` or a `Board`. `null` means the user hasn't copied anything yet, a `Board` value means the user copied a board, which can be pasted on the welcome screen.
export const showLabelsText: { value: boolean } = $state({value: SaveLoadManager.getData().showLabelsText}); // Defines whether or not the labels on cards on the board screen should show their text. When `false`, only the color will be shown.
export const invalidateLabels: { value: boolean } = $state({value: false}) //This is used in conjunction with the `{#key}` attribute to forcibly rerender labels when either their color and/or text changed. The actual boolean value (true/false) is irrelevant. Changing the value (toggling between true and false) invalidates the `{#key}` attribute, which in turn triggers a re-render of the labels.
export const listsSortOrder: { value: (a: List, b: List) => number } = $state({value: (a, b) => 0}) // Defines the function that should be used to sort the lists on the board screen. The default value makes it so the order of the lists remains unchanged.