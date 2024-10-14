import introJs from "intro.js";
import "intro.js/introjs.css";
import {SaveLoadManager} from "./SaveLoad/SaveLoadManager";
import {readDir} from "@tauri-apps/plugin-fs";
import {resolve, resolveResource, resourceDir} from "@tauri-apps/api/path";
import {shuffle} from "./KnuthShuffle";
import CardCreationDateVideo from "../videos/OnboardingCardCreationDate.mp4";
import ShiftClickDeleteCardVideo from "../videos/OnboardingShiftClickDeleteCard.mp4";
import {I18n} from "./I18n/I18n";
import {relaunch} from "@tauri-apps/plugin-process";

/**
 * This function starts the onboarding for the welcome screen. Once the onboarding for the welcome screen is finished, it calls the function that handles the onboarding for the board screen
 * @param setSelectedBoard Function used to set the $selectedBoard store (we can't access Svelte stores in .ts files, hence why use a lambda to set the store)
 * @param setSelectedCard Function used to set the $selectedCard store (we can't access Svelte stores in .ts files, hence why use a lambda to set the store)
 */
export default function startWelcomeScreenOnBoarding(setSelectedBoard: (id: string) => void, setSelectedCard: (id: string) => void)
{
    let onboardingStepComplete = false;
    let canExit = true;

    introJs().onbeforeexit(() => canExit /*Makes it so we cant exit the onboarding by pressing esc, click on overlay or the skip AKA close button*/).setOptions({
        steps:[
            {title: I18n.t("welcomeToTakma"), intro:I18n.t("quickGuideEssentials")},
            {intro: I18n.t("redoOnboardingProcess"), element: document.querySelector(".startOnboarding")},
            {intro: I18n.t("dueDatesOverviewExplanation"), element: document.querySelector(".dueDatesOverviewButton")},
            {intro: I18n.t("createNewBoards"), element: document.querySelector(".createButton")},
        ],
        disableInteraction: true,
        tooltipClass: "IntroJsCSSOverride",
        nextLabel: I18n.t("next"),
        prevLabel: I18n.t("back"),
        doneLabel: I18n.t("done"),
        exitOnEsc: false,
        exitOnOverlayClick: false
    }).oncomplete(async () => {
        onboardingStepComplete = true;

        const includedImagesPaths = await Promise.all((await readDir((await resolveResource("resources/backgrounds/")))).map(async fileEntry => await resolve(await resourceDir(), "resources", "backgrounds", fileEntry.name)));
        shuffle(includedImagesPaths);
        const boardBg = includedImagesPaths[0];

        const boardId = await SaveLoadManager.getData().createNewBoard(I18n.t("onboarding"), boardBg); //Create a new board that will be used for the rest of the onboarding. This board will be deleted at the end of the onboarding
        const listId = SaveLoadManager.getData().createNewList(boardId, I18n.t("listTitle"));
        const cardId = SaveLoadManager.getData().createNewCard(I18n.t("cardTitle"), boardId, listId);

        setSelectedBoard(boardId); //Sets the $selectedBoardId Svelte store, i.e. opens the boardscreen
        canExit = true;
        startBoardScreenOnBoarding(boardId, cardId, setSelectedCard, () => {setSelectedCard(""); setSelectedBoard("");});
    }).onexit(() => {
        // If the user exits the onboarding process before completing it
        if (!onboardingStepComplete)
        {
            SaveLoadManager.getData().onboardingCompleted = true; // Even if the user exits the onboarding process prematurely, mark it as complete in the savefile to prevent it from starting automatically at the next startup
        }
    }).start();
}

/**
 * This function starts the onboarding for the board screen. Once the onboarding for the board screen is finished, it calls the function that handles the onboarding for the card details screen
 * @param currentBoardId The id of the board the onboarding is taking place on
 * @param currentCardId The id of the card the onboarding will use
 * @param setSelectedCard Function used to set the $selectedCard store (we can't access Svelte stores in .ts files, hence why use a lambda to set the store)
 * @param returnToWelcomeScreen Function used to return to the welcome screen after exiting or completing the onboarding
 */
export async function startBoardScreenOnBoarding(currentBoardId: string, currentCardId: string, setSelectedCard: (id: string) => void, returnToWelcomeScreen: () => void)
{
    await waitForIntroJsRemovalFromDOM(); //We can't start another instance of IntroJs before the current one is removed. It gets removed automatically when the onboarding is complete + the last line in `oncomplete()` has been executed. So we just need to wait until it's actually removed from the DOM

    let onboardingStepComplete = false;
    let canExit = true;

    await introJs().onbeforeexit(() => canExit /*Makes it so we cant exit the onboarding by pressing esc, click on overlay or the skip AKA close button*/).setOptions({
        steps:[
            {title: I18n.t("boardScreen"), intro:I18n.t("efficientTaskManagement")},
            {intro: I18n.t("returnToHomeScreen"), element: document.querySelector(".takmaLogo"), disableInteraction: true},
            {intro: I18n.t("renameBoardTitle"), element: document.querySelector(".boardTitle")},
            {intro: I18n.t("setNewBoardBackground"), element: document.querySelector(".container")},
            {intro: I18n.t("copyBoardLink"), element: document.querySelector(".copyLinkButton")},
            {intro: I18n.t("deleteCardShiftClick") + `<br><div style='display: flex; justify-content: center; align-items: center'><video src=${ShiftClickDeleteCardVideo} autoplay loop width=300</video></video></div>`, element: document.querySelector(".cardContainer"), disableInteraction: true},
            {intro: I18n.t("rearrangeCardsDragDrop"), element: document.querySelector(".cardContainer"), disableInteraction: true},
            {intro: I18n.t("rearrangeListsDragDrop"), element: document.querySelector(".list"), disableInteraction: true},
            {intro: I18n.t("sortShuffleListCards"), element: document.querySelector(".listOptionsMenu"), disableInteraction: true},
        ],
        disableInteraction: false,
        tooltipClass: "IntroJsCSSOverride",
        nextLabel: I18n.t("next"),
        prevLabel: I18n.t("back"),
        doneLabel: I18n.t("done"),
        exitOnEsc: false,
        exitOnOverlayClick: false
    }).oncomplete(async () => {
        onboardingStepComplete = true;
        setSelectedCard(currentCardId); //Sets the $selectedBoardId Svelte store, i.e. opens the boardscreen
        canExit = true;
        startCardDetailsScreenOnBoarding(currentBoardId, returnToWelcomeScreen);
    }).onexit(async () => {
        // If the user exits the onboarding process before completing it
        if (!onboardingStepComplete)
        {
            SaveLoadManager.getData().onboardingCompleted = true; // Even if the user exits the onboarding process prematurely, mark it as complete in the savefile to prevent it from starting automatically at the next startup
            await SaveLoadManager.getData().deleteBoard(currentBoardId); // Delete the board that was created during the onboarding
            returnToWelcomeScreen();
        }
    }).start();
}

/**
 * This function starts the onboarding for the card details screen.
 * @param currentBoardId The id of the board the onboarding is taking place on
 * @param returnToWelcomeScreen Function used to return to the welcome screen after exiting or completing the onboarding
 */
export async function startCardDetailsScreenOnBoarding(currentBoardId: string, returnToWelcomeScreen: () => void)
{
    await waitForIntroJsRemovalFromDOM(); //We can't start another instance of IntroJs before the current one is removed. It gets removed automatically when the onboarding is complete + the last line in `oncomplete()` has been executed. So we just need to wait until it's actually removed from the DOM

    let canExit = true;

    await introJs().onbeforeexit(() => canExit /*Makes it so we cant exit the onboarding by pressing esc, click on overlay or the skip AKA close button*/).setOptions({
        steps:[
            {title: I18n.t("cardDetailsScreen"), intro:I18n.t("editCardDetailsHub")},
            {intro: I18n.t("autoSaveCardEdits"), element: document.querySelector(".popup")},
            {intro: I18n.t("viewCreationDateHover") + `<br><div style='display: flex; justify-content: center; align-items: center'><video src=${CardCreationDateVideo} autoplay loop width=208 height=74</video></div>`, element: document.querySelector(".separator")},
            {intro: I18n.t("markdownCardDescriptions"), element: document.querySelector(".renderedDescriptionHolder")},
            {intro: I18n.t("addAttachmentsDragDrop"), element: document.getElementById("cardDetailsAttachmentsButton")},
            {intro: I18n.t("addCover"), element: document.getElementById("cardDetailsCoverButton")},
            {intro: I18n.t("copyCardLink"), element: document.getElementById("cardDetailsCopyLinkButton")},
            {intro: I18n.t("cardFullscreen"), element: document.querySelector(".fullScreenButton")},
        ],
        disableInteraction: false,
        tooltipClass: "IntroJsCSSOverride",
        nextLabel: I18n.t("next"),
        prevLabel: I18n.t("back"),
        doneLabel: I18n.t("done"),
        exitOnEsc: false,
        exitOnOverlayClick: false
    }).onexit(async () => {
        SaveLoadManager.getData().onboardingCompleted = true;
        await SaveLoadManager.getData().deleteBoard(currentBoardId); // Delete the board that was created during the onboarding
        canExit = true;
        returnToWelcomeScreen();
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