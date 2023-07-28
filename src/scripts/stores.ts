import {writable} from "svelte/store";

export const selectedBoardId = writable(""); //When a board is selected/being displayed this holds that board's id. When we are on the welcome screen, i.e. when there is no board selected this is an empty string
export const selectedCardId = writable(""); //When a card is selected/being displayed this holds that card's id. When there is no card selected this will be an empty string.
export const searchBarValue = writable(""); //This contains the value of the searchbar
export const draggingCardOrList = writable(false); //If a card or list is being dragged, this is true, otherwise it is false.