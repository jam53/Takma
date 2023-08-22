import introJs from "intro.js";
import "intro.js/introjs.css";
import {SaveLoadManager} from "./SaveLoad/SaveLoadManager";
import {readDir} from "@tauri-apps/api/fs";
import {resolveResource} from "@tauri-apps/api/path";
import {shuffle} from "./KnuthShuffle";
import CardCreationDateVideo from "../videos/OnboardingCardCreationDate.mp4";
import ShiftClickDeleteCardVideo from "../videos/OnboardingShiftClickDeleteCard.mp4";

/**
 * This function starts the onboarding for the welcome screen. Once the onboarding for the welcome screen is finished, it calls the function that handles the onboarding for the board screen
 * @param setSelectedBoard Function used to set the $selectedBoard store (we can't access Svelte stores in .ts files, hence why use a lambda to set the store)
 * @param setSelectedCard Function used to set the $selectedCard store (we can't access Svelte stores in .ts files, hence why use a lambda to set the store)
 */
export default function startWelcomeScreenOnBoarding(setSelectedBoard: (id: string) => void, setSelectedCard: (id: string) => void)
{
    let canExit = false;

    introJs().onbeforeexit(() => canExit /*Makes it so we cant exit the onboarding by pressing esc, click on overlay or the skip AKA close button*/).setOptions({
        steps:[
            {title: "%%Welcome to Takma!", intro:"%%This quick guide will walk you through the essentials."},
            {intro: "%%If you ever want to redo or revisit the onboarding process, simply click on the question mark icon here.", element: document.querySelector(".startOnboarding")},
            {intro: "%%You can create new boards from here.", element: document.querySelector(".createButton")},
        ],
        disableInteraction: true,
        tooltipClass: "IntroJsCSSOverride",
        nextLabel: "%%Next",
        prevLabel: "%%Back",
        doneLabel: "%%Done",
        skipLabel: "",
        exitOnEsc: false,
        exitOnOverlayClick: false
    }).oncomplete(async () => {
        const includedImagesPaths = (await readDir((await resolveResource("resources/backgrounds/")))).map(fileEntry => fileEntry.path);
        shuffle(includedImagesPaths);
        const boardBg = includedImagesPaths[0];

        const boardId = await SaveLoadManager.getData().createNewBoard("%%Onboarding", boardBg); //Create a new board that will be used for the rest of the onboarding. This board will be deleted at the end of the onboarding
        const listId = SaveLoadManager.getData().createNewList(boardId, "%%Title of list");
        const cardId = SaveLoadManager.getData().createNewCard("%%Title of Card", boardId, listId);

        setSelectedBoard(boardId); //Sets the $selectedBoardId Svelte store, i.e. opens the boardscreen
        canExit = true;
       startBoardScreenOnBoarding(boardId, cardId, setSelectedCard);
    }).start();
}

/**
 * This function starts the onboarding for the board screen. Once the onboarding for the board screen is finished, it calls the function that handles the onboarding for the card details screen
 * @param currentBoardId The id of the board the onboarding is taking place on
 * @param currentCardId The id of the card the onboarding will use
 * @param setSelectedCard Function used to set the $selectedCard store (we can't access Svelte stores in .ts files, hence why use a lambda to set the store)
 */
export async function startBoardScreenOnBoarding(currentBoardId: string, currentCardId: string, setSelectedCard: (id: string) => void)
{
    await waitForIntroJsRemovalFromDOM(); //We can't start another instance of IntroJs before the current one is removed. It gets removed automatically when the onboarding is complete + the last line in `oncomplete()` has been executed. So we just need to wait until it's actually removed from the DOM

    let canExit = false;

    await introJs().onbeforeexit(() => canExit /*Makes it so we cant exit the onboarding by pressing esc, click on overlay or the skip AKA close button*/).setOptions({
        steps:[
            {title: "%%The board screen", intro:"%%On to the board screen you can efficiently manage your tasks using lists and cards."},
            {intro: "%%To return to the home screen, simply click on the Takma icon, or alternatively, use the keyboard shortcuts ESC or Ctrl+W.", element: document.querySelector(".takmaLogo"), disableInteraction: true},
            {intro: "%%Boards can be renamed by clicking on their title.", element: document.querySelector(".boardTitle")},
            {intro: "%%A new background image for the board can be set by right clicking on the board's background or by dragging and dropping an image onto the existing background.", element: document.querySelector(".container")},
            {intro: "%%This button enables you to copy a link to this board, which can then be pasted into the description of any card, even those within other boards. Clicking on this link in a card's description will effectively open this particular board.", element: document.querySelector(".copyLinkButton")},
            {intro: "%%Cards can easily be deleted by pressing the Shift key and clicking on a card. This action removes the card, in contrast to the regular click action which would open the card." + `<br><div style='display: flex; justify-content: center; align-items: center'><video src=${ShiftClickDeleteCardVideo} autoplay loop width=300</video></video></div>`, element: document.querySelector(".cardContainer"), disableInteraction: true},
            {intro: "%%You can rearrange the order of cards within a list by simply dragging and dropping them. Furthermore, cards can also be moved from one list to another using the drag-and-drop action.", element: document.querySelector(".cardContainer"), disableInteraction: true},
            {intro: "%%Similar to cards, you can also change the order of lists by dragging and dropping them.", element: document.querySelector(".list"), disableInteraction: true},
            {intro: "%%You can sort or shuffle cards within a list by accessing the options menu specific to that list.", element: document.querySelector(".listOptionsMenu"), disableInteraction: true},
        ],
        disableInteraction: false,
        tooltipClass: "IntroJsCSSOverride",
        nextLabel: "%%Next",
        prevLabel: "%%Back",
        doneLabel: "%%Done",
        skipLabel: "",
        exitOnEsc: false,
        exitOnOverlayClick: false
    }).oncomplete(async () => {
        setSelectedCard(currentCardId); //Sets the $selectedBoardId Svelte store, i.e. opens the boardscreen
        canExit = true;
        startCardDetailsScreenOnBoarding(currentBoardId);
    }).start();
}

/**
 * This function starts the onboarding for the card details screen.
 * @param currentBoardId The id of the board the onboarding is taking place on
 */
export async function startCardDetailsScreenOnBoarding(currentBoardId: string)
{
    await waitForIntroJsRemovalFromDOM(); //We can't start another instance of IntroJs before the current one is removed. It gets removed automatically when the onboarding is complete + the last line in `oncomplete()` has been executed. So we just need to wait until it's actually removed from the DOM

    let canExit = false;

    await introJs().onbeforeexit(() => canExit /*Makes it so we cant exit the onboarding by pressing esc, click on overlay or the skip AKA close button*/).setOptions({
        steps:[
            {title: "%%The card details screen", intro:"%%The card details screen serves as a comprehensive hub for editing cards, enabling you to make modifications such as adding attachments, creating checklists, setting due dates, adjusting titles, and refining descriptions."},
            {intro: "%%Any alterations made to a card will automatically be saved upon closing the card. In addition to using the close button or clicking outside the card, you can also close a card by pressing ESC or Ctrl+W. It's worth noting that the ESC or Ctrl+W shortcuts apply to various screens and pop-ups within Takma.", element: document.querySelector(".popup")},
            {intro: "%%To view the card's creation date, simply hover your cursor over the separator located beneath the card's title." + `<br><div style='display: flex; justify-content: center; align-items: center'><video src=${CardCreationDateVideo} autoplay loop width=208 height=74</video></div>`, element: document.querySelector(".separator")},
            {intro: "%%Card descriptions are written in Markdown, giving you the ability to embed images, create tables, add headings, and utilize a variety of other formatting options. Takma fully supports all Markdown features.", element: document.querySelector(".renderedDescriptionHolder")},
            {intro: "%%You can add attachments to cards not only by clicking this button but also by dragging and dropping files directly onto the card.", element: document.getElementById("cardDetailsAttachmentsButton")},
            {intro: "%%Much like the board's 'copy link' button, this button enables you to copy a link to this card. You can then paste this link into the description of any card, including those in different boards. Clicking on this link within another card's description will open this specific card.", element: document.getElementById("cardDetailsCopyLinkButton")},
        ],
        disableInteraction: false,
        tooltipClass: "IntroJsCSSOverride",
        nextLabel: "%%Next",
        prevLabel: "%%Back",
        doneLabel: "%%Done",
        skipLabel: "",
        exitOnEsc: false,
        exitOnOverlayClick: false
    }).oncomplete(async () => {
        SaveLoadManager.getData().onboardingCompleted = true;
        await SaveLoadManager.getData().deleteBoard(currentBoardId); //Delete the board that was used for the onboarding
        canExit = true;
        location.reload(); //Reload Takma
    }).start();
}

/**
 * This function waits/keeps running until there is no instance of IntroJs left in the DOM
 */
function waitForIntroJsRemovalFromDOM() {
    return new Promise(resolve => {
        const checkInterval = setInterval(() => {
            const element = document.querySelector(".introjsFloatingElement");

            if (!element) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100); // Check every 100 milliseconds
    });
}