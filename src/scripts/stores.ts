import {type Writable, writable} from "svelte/store";
import type {CopiedCard, CopiedList} from "./Board";

export const selectedBoardId = writable(""); //When a board is selected/being displayed this holds that board's id. When we are on the welcome screen, i.e. when there is no board selected this is an empty string
export const selectedCardId = writable(""); //When a card is selected/being displayed this holds that card's id. When there is no card selected this will be an empty string.
export const searchBarValue = writable(""); //This contains the value of the searchbar
export const draggingCardOrList = writable(false); //If a card or list is being dragged, this is true, otherwise it is false.
export const cardFilters: Writable<{labelIds: string[], dueDates: number[]}> = writable({labelIds: [], dueDates: []}) //The board screen will filter the cards based on these values. Initially we made it so multiple due date filters could be selected, hence why the Svelte store contains an *array* of numbers for the due dates. Now, in retro spect it makes more sense to only be able to select a single due date. For compatibility reasons with the rest of the codebase, we kept the `dueDates` in the `cardFilters` store an array. But we will only ever store a single due date in it.
export const dueDatesOverviewPopupIsVisible = writable(false); //True if the DueDatesOverviewPopup is being shown else false.
export const copiedCard: Writable<CopiedCard | null> = writable(null); //Contains either `null` or a `CopiedCard`. `null` means the user hasn't copied anything yet, a `CopiedCard` value means the user copied a card, which can be pasted within any list, even in other boards.
export const copiedList: Writable<CopiedList | null> = writable(null); //Contains either `null` or a `CopiedList`. `null` means the user hasn't copied anything yet, a `CopiedList` value means the user copied a list, which can be pasted within any board.