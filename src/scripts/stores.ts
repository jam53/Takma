import {writable} from "svelte/store";

export const selectedBoardId = writable(""); //When a board is selected/being displayed this holds that boards id. When we are on the welcome screen, i.e. when there is no board selected this is an empty string
export const selectedBoardTitle = writable(""); //This contains the title of the board that is currently being displayed
export const searchBarValue = writable(""); //This contains the value of the searchbar