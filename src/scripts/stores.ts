import {writable} from "svelte/store";

export const boardSelected = writable(false); //When a board is selected/being displayed this gets set to true. When we are on the welcome screen it is set to false
export const selectedBoardTitle = writable(""); //This contains the title of the board that is currently being displayed
export const searchBarValue = writable(""); //This contains the value of the searchbar