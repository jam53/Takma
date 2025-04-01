import type {Board, Card, Label, List} from "./Board";
import {SaveLoadManager} from "./SaveLoad/SaveLoadManager";

export const selectedBoardId: { value: string } = $state({value: ""}); //When a board is selected/being displayed this holds that board's id. When we are on the welcome screen, i.e. when there is no board selected this is an empty string
export const selectedCardId: { value: string } = $state({value: ""}); //When a card is selected/being displayed this holds that card's id. When there is no card selected this will be an empty string.
export const searchBarValue: { value: string } = $state({value: ""}); //This contains the value of the searchbar
export const cardFilters: { labelIds: string[], dueDate: number, complete: boolean, incomplete: boolean } = $state({labelIds: [], dueDate: Number.MAX_SAFE_INTEGER, complete: false, incomplete: false}) //The board screen will filter the cards based on these values.
export const dueDatesOverviewPopupIsVisible: { value: boolean } = $state({value: false}); //True if the DueDatesOverviewPopup is being shown else false.
/**
 * Reactive store holding the card currently copied to the clipboard.
 * - `card`: Contains the data of the copied card (deep copy).
 *          Is `null` if no card is currently copied.
 * - `referencedLabels`: Stores the *original Label objects* associated with the copied card,
 *                      retrieved from the source board. This is crucial for reconciling
 *                      labels when pasting into a potentially different board.
 */
export const copiedCard: { card: Card | null, referencedLabels: Label[] } = $state({card: null, referencedLabels: []});
/**
 * Reactive store holding the list currently copied to the clipboard.
 * - `list`: Contains the data of the copied list and its cards (deep copy).
 *           Is `null` if no list is currently copied.
 * - `referencedLabels`: Stores the *original Label objects* associated with *all cards* within
 *                      the copied list, retrieved from the source board. This is used
 *                      for label reconciliation during pasting into a potentially different board.
 */
export const copiedList: { list: List | null, referencedLabels: Label[] } = $state({list: null, referencedLabels: []});
export const copiedBoard: { value: Board | null } = $state({value: null}); //Contains either `null` or a `Board`. `null` means the user hasn't copied anything yet, a `Board` value means the user copied a board, which can be pasted on the welcome screen.
export const showLabelsText: { value: boolean } = $state({value: SaveLoadManager.getData().showLabelsText}); // Defines whether or not the labels on cards on the board screen should show their text. When `false`, only the color will be shown.
export const invalidateLabels: { value: boolean } = $state({value: false}) //This is used in conjunction with the `{#key}` attribute to forcibly rerender labels when either their color and/or text changed. The actual boolean value (true/false) is irrelevant. Changing the value (toggling between true and false) invalidates the `{#key}` attribute, which in turn triggers a re-render of the labels.
export const listsSortOrder: { value: (a: List, b: List) => number } = $state({value: (a, b) => 0}) // Defines the function that should be used to sort the lists on the board screen. The default value makes it so the order of the lists remains unchanged.