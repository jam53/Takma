<script lang="ts">
    import {blur, slide} from "svelte/transition";
    import {onDestroy, mount, untrack} from "svelte";
    import {invalidateLabels, selectedBoardId, selectedCardId} from "../../scripts/Stores.svelte.js";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import type {Card, List} from "../../scripts/Board";
    import {clickOutside} from "../../scripts/ClickOutside";
    import {readText, writeText} from "@tauri-apps/plugin-clipboard-manager";
    import LabelsPopup from "./LabelsPopup.svelte";
    import {getCurrentWebviewWindow} from "@tauri-apps/api/webviewWindow";
    import {toast, Toaster} from "svelte-sonner";
    import CheckLists from "./CheckLists.svelte";
    import Attachments from "./Attachments.svelte";
    import {
        imageExtensions,
        removeFileFromSaveDirectory,
        saveAbsoluteFilePathToSaveDirectory,
        saveFileToSaveDirectory
    } from "../../scripts/TakmaDataFolderIO";
    import {open as openDialog} from "@tauri-apps/plugin-dialog";
    import DueDatePopup from "./DueDatePopup.svelte";
    import {I18n} from "../../scripts/I18n/I18n";
    import PopupWindow from "../PopupWindow.svelte";
    import {listen} from "@tauri-apps/api/event";
    import {convertFileSrc} from "@tauri-apps/api/core";
    import {debug, info} from "@tauri-apps/plugin-log";
    import TipTap from "./Tiptap/Tiptap.svelte";

    interface Props {
        refreshList: (listToRefresh: List) => void;
        refreshCard: (cardToRefresh: Card) => void;
        reloadLists: () => void;
    }

    let {
        refreshList,
        refreshCard,
        reloadLists,
    }: Props = $props();

    let card: Card|null = $state(null);
    $effect(() => {
        card = SaveLoadManager.getData().getCard(selectedBoardId.value, selectedCardId.value);
    });

    let showPlainTextEditor: boolean = $state(false); // Used to define if the rendered Markdown editor should be displayed or the plain text editor for the card's description

    $effect(() =>
    {
        if (!showPlainTextEditor)
        {
            focusOnCardDetailsFunction(); //If we don't focus on this component, we won't be able to listen to the on:keydown events such as ESC and Ctrl + W which are used to close this component/card details popup
        }
    });

    // Focus on this component when the value of `selectedCardId` changes to a value that isn't empty. This ensures that when the user clicked on a Takma link in the description of a card and thus opened another card, we can still listen to keyboard events to detect shortcuts like ESC and CTRL + W to close the card.
    // Should we not do this, this component would no longer be focussed after the user clicked on a Takma link causing the ESC and CTRL + W shortcuts to not register
    $effect(() => {
        if (selectedCardId.value !== "")
        {
            info("Opening card: " + selectedCardId.value);
            focusOnCardDetailsFunction();
        }
    })


    function handleKeyDown(e: KeyboardEvent)
    {
        e.stopPropagation();
        if((e.key === "Escape" || (e.key.toLowerCase() === "w" && e.ctrlKey)) && SaveLoadManager.getData().onboardingCompleted)
        {
            closeCard();
        }
    }

    function closeCard()
    {
        selectedCardId.value = "";
        document.activeElement.blur(); //This should or could help preventing the issue where cards can't be dragged at times.
    }

    // Automatically save the selected card when any changes are made
    $effect(() => {
        if (card)
        {
            debug("Saving card: " + card.id);
            SaveLoadManager.getData().updateCard($state.snapshot(card), selectedBoardId.value, selectedCardId.value);
            refreshCard(card);
        }
    })

    let overlayElement: HTMLElement | null = $state(null);

    /**
     * Returns an URL for an image.
     *
     * If the `imageSrc` is already an HTTP or HTTPS URL, it's returned directly.
     * If `imageSrc` is a path to a local file, a URL is generated for it using the `convertFileSrc` function.
     *
     * @param imageSrc - The URL or file path of the image.
     * @returns The URL of the image.
     */
    function getImageUrl(imageSrc: string): string
    {
        // If the image is a http or https url
        if (imageSrc.match(/^(http|https)/))
        {
            return imageSrc;
        }
        // If the image is saved in Takma's data folder
        else if (imageSrc.startsWith(SaveLoadManager.getBoardFilesDirectory()))
        {
            return convertFileSrc(SaveLoadManager.getSaveDirectoryPath() + imageSrc);
        }
        // If the image is stored somewhere locally on disk
        else
        {
            return convertFileSrc(imageSrc);
        }
    }
    //endregion

    $effect(() => overlayElement && applyMaximizedNotMaximizedStyleClasses());
    const appWindow = getCurrentWebviewWindow()
    appWindow.onResized(() => applyMaximizedNotMaximizedStyleClasses());
    async function applyMaximizedNotMaximizedStyleClasses()
    {
        let isMaximized = await appWindow.isMaximized();

        if (isMaximized)
        {
            overlayElement?.classList.add("overlayScreenMaximized");
        }
        else
        {
            overlayElement?.classList.remove("overlayScreenMaximized");
        }
    }

    function focusOnCardDetailsFunction()
    {
        overlayElement?.focus();
    }

    let checkListComponent: CheckLists;

    async function addAttachment()
    {
        const selectedFile = await openDialog({
            multiple: true,
        });

        if (Array.isArray(selectedFile))
        {//User selected multiple files
            for (let file of selectedFile)
            {
                let savedFilePath = await saveAbsoluteFilePathToSaveDirectory(file, selectedBoardId.value); //We save the selected file to Takma's data folder, this way we can still access it even if the original file is deleted/moved
                card.attachments.push(savedFilePath);
            }
        }
        else if (selectedFile !== null)
        {//User selected a single file
            let savedFilePath = await saveAbsoluteFilePathToSaveDirectory(selectedFile, selectedBoardId.value); //We save the selected file to Takma's data folder, this way we can still access it even if the original file is deleted/moved
            card.attachments.push(savedFilePath);
        }
    }

    let unlisten;
    (async () => {unlisten = await listen('tauri://drag-drop', async event => {
        if (selectedCardId.value != "") //We only want to react to this filedrop event if there is a card selected. Otherwise it would mean the drop event was meant to change the background image of the board. Rather than to drop attachements onto a card.
        {
            await fileDropAttachments(event.payload.paths);
        }
    })})();
    onDestroy(() => {
        unlisten();
    })

    /**
     * If the user drops one or more files onto the card, this function will add the files as attachments to the card
     */
    async function fileDropAttachments(droppedFiles: String[])
    {
        for (let droppedFile of droppedFiles)
        {
            let savedPath = await saveAbsoluteFilePathToSaveDirectory(droppedFile, selectedBoardId.value);
            card.attachments.push(savedPath);
        }
    }

    /**
     * Prompts the user with a file picker to select a cover image, or removes the current cover image if there was already a cover image set for this card.
     */
    async function setCoverImage()
    {
        if (card.coverImage !== "")
        {
            const deleteCoverImageFunction = async () => {
                await removeFileFromSaveDirectory(card.coverImage);
                card.coverImage = "";
                toast(I18n.t("removeCardCoverImage"));
            }

            if (!SaveLoadManager.getData().showConfirmationPreferences.deleteCoverImage)
            {
                await deleteCoverImageFunction();
            }
            else
            {
                const popup = mount(PopupWindow, {props: {description: I18n.t("confirmCoverImageRemoval"), buttonType: "yesno", showConfirmation: true}, target: document.body, intro: true});

                if (await popup.getAnswer() === true)
                {
                    await SaveLoadManager.getData().updateConfirmationPreference("deleteCoverImage", popup.getShowConfirmationAgain());
                    await deleteCoverImageFunction();
                }
            }
        }
        else
        {
            const selected = await openDialog({
                multiple: false,
                filters: [{
                    name: I18n.t("image"),
                    extensions: imageExtensions
                }]
            });

            if (selected !== null && typeof(selected) === "string")
            {
                card.coverImage = await saveAbsoluteFilePathToSaveDirectory(selected, selectedBoardId.value); //We save the selected file to Takma's data folder, this way we can still access it even if the original file is deleted/moved

                toast(I18n.t("addCardCoverImage"))
            }
        }
    }

    async function deleteCard()
    {
        const deleteCardFunction = () => {
            const listIdCardIsIn = SaveLoadManager.getData().getListContainingCard(selectedBoardId.value, selectedCardId.value).id; // Store the ID of the list that contains the card *before* the card is deleted. This is essential because after deletion, `getListContainingCard()` will no longer return the list the card was in, as it uses the deleted card's ID to find the list. But as the deleted card no longer exists in the list, `getListContainingCard()` won't be able to find the list.

            SaveLoadManager.getData().deleteCard(selectedBoardId.value, selectedCardId.value);
            refreshList(SaveLoadManager.getData().getList(selectedBoardId.value, listIdCardIsIn));
            selectedCardId.value = "";
        }

        if (!SaveLoadManager.getData().showConfirmationPreferences.deleteCard)
        {
            deleteCardFunction();
        }
        else
        {
            const popup = mount(PopupWindow, {props: {description: I18n.t("confirmCardRemoval"), buttonType: "yesno", showConfirmation: true}, target: document.body, intro: true});

            if (await popup.getAnswer() === true)
            {
                await SaveLoadManager.getData().updateConfirmationPreference("deleteCard", popup.getShowConfirmationAgain());
                deleteCardFunction();
            }
        }
    }

    let isCardFullscreen = $state(SaveLoadManager.getData().cardsFullscreen);
    function toggleFullscreen(e?: MouseEvent)
    {
        e?.stopPropagation();
        isCardFullscreen = !isCardFullscreen;
        SaveLoadManager.getData().cardsFullscreen = isCardFullscreen;
    }

    let markdownTextArea: HTMLElement | null = $state(null);
    $effect(() => markdownTextArea && initializeEasyMDE());
    function initializeEasyMDE()
    {
        let easyMDE = new EasyMDE({
            element: markdownTextArea,
            autoDownloadFontAwesome: false,
            autofocus: true,
            uploadImage: true,
            promptURLs: true,
            previewImagesInEditor: true,
            showIcons: ["code", "table", "image", "upload-image", "horizontal-rule", "heading-smaller", "heading-bigger", "strikethrough"],
            hideIcons: ["fullscreen", "side-by-side", "preview"],
            indentWithTabs: false,
            spellChecker: false,
            nativeSpellcheck: false,
            placeholder: I18n.t("addDetailedDescriptionMarkdown"),
            unorderedListStyle: "-",
            minHeight: "10em",
            insertTexts: {
                horizontalRule: ["", "\n\n---\n\n"],
                table: ["", "\n\n| 1 | 2 | 3 |\n|:-:|:-:|:-:|\n| A | B | C |\n\n"],
            },
            imageAccept: "image/png, image/jpeg", //Overwritten by imageUploadFunction
            imageMaxSize: 1024 * 1024 * 2, //Overwritten by imageUploadFunction
            imageTexts: {sbInit: I18n.t("attachImagesClipboard"), sbOnDrop: I18n.t("processingImage"), sbOnUploaded: I18n.t("processedImage")},
            promptTexts: {image: I18n.t("urlOfImage"), link: I18n.t("urlOfLink")},
            imagesPreviewHandler: getImageUrl,
            imageUploadFunction: async (file: File, onSuccess, onError) =>
            {
                const fileMime = file.type.split("/"); //file.type is a mime-type, eg. "image/png"
                if (fileMime[0] !== "image" || !imageExtensions.includes(fileMime[1].toLowerCase()))
                {
                    onError(I18n.t("onlyImageFilesSupported", imageExtensions.sort().join(", ")));
                }
                else
                {
                    let path = (await saveFileToSaveDirectory(file, selectedBoardId.value)).replace(/\\/g, '/'); //Ensure the file path uses forward slashes for Markdown image links, converting any backslashes from Windows file paths.
                    onSuccess(path);
                }
            },
            toolbar: [
                {
                    name: 'bold',
                    action: EasyMDE.toggleBold,
                    className: "fa fa-bold",
                    title: I18n.t("bold"),
                    default: true,
                },
                {
                    name: 'italic',
                    action: EasyMDE.toggleItalic,
                    className: "fa fa-italic",
                    title: I18n.t("italic"),
                    default: true,
                },
                {
                    name: "underline",
                    action: EasyMDE.toggleUnderline,
                    className: "fa fa-underline",
                    title: I18n.t("underline"),
                },
                {
                    name: 'strikethrough',
                    action: EasyMDE.toggleStrikethrough,
                    className: "fa fa-strikethrough",
                    title: I18n.t("strikethrough"),
                },
                {
                    name: 'heading',
                    action: EasyMDE.toggleHeadingSmaller,
                    className: "fa fa-header fa-heading",
                    title: I18n.t("heading"),
                    default: true,
                },
                {
                    name: 'heading-smaller',
                    action: EasyMDE.toggleHeadingSmaller,
                    className: "fa fa-header fa-heading header-smaller",
                    title: I18n.t("smallerHeading"),
                },
                {
                    name: 'heading-bigger',
                    action: EasyMDE.toggleHeadingBigger,
                    className: "fa fa-header fa-heading header-bigger",
                    title: I18n.t("biggerHeading"),
                },
                "|",
                {
                    name: 'code',
                    action: EasyMDE.toggleCodeBlock,
                    className: "fa fa-code",
                    title: I18n.t("code"),
                },
                {
                    name: 'quote',
                    action: EasyMDE.toggleBlockquote,
                    className: "fa fa-quote-left",
                    title: I18n.t("quote"),
                    default: true,
                },
                {
                    name: 'unordered-list',
                    action: EasyMDE.toggleUnorderedList,
                    className: "fa fa-list-ul",
                    title: I18n.t("genericList"),
                    default: true,
                },
                {
                    name: 'ordered-list',
                    action: EasyMDE.toggleOrderedList,
                    className: "fa fa-list-ol",
                    title: I18n.t("numberedList"),
                    default: true,
                },
                "|",
                {
                    name: 'link',
                    action: EasyMDE.drawLink,
                    className: "fa fa-link",
                    title: I18n.t("createLink"),
                    default: true,
                },
                {
                    name: 'image',
                    action: EasyMDE.drawImage,
                    className: "fa fa-image",
                    title: I18n.t("insertImage"),
                    default: true,
                },
                {
                    name: 'upload-image',
                    action: EasyMDE.drawUploadedImage,
                    className: "fa fa-image",
                    title: I18n.t("importImage"),
                },
                {
                    name: 'table',
                    action: EasyMDE.drawTable,
                    className: "fa fa-table",
                    title: I18n.t("insertTable"),
                },
                {
                    name: 'horizontal-rule',
                    action: EasyMDE.drawHorizontalRule,
                    className: "fa fa-minus",
                    title: I18n.t("insertHorizontalLine"),
                },
                "|",
                {
                    name: 'guide',
                    action: 'https://www.markdownguide.org/basic-syntax/',
                    className: "fa fa-question-circle",
                    noDisable: true,
                    title: I18n.t("markdownGuide"),
                    default: true,
                }
            ],
        });

        easyMDE.codemirror.on("change", () => card.description = easyMDE.value().trim());

        //Remove the EasyMDE element from the DOM once we show the rendered markdown AKA click outside the EasyMDEContainer
        let easyMDEContainer = document.getElementsByClassName("EasyMDEContainer")[0];
        const clickOutsideAction =  clickOutside(easyMDEContainer);
        easyMDEContainer.addEventListener('click_outside', () => {
            //The `(window.getSelection().toString().length === 0)` check ensures that selecting text won't fire a `click_outside` event. If we were to press and hold the mouse button to select a part of the description. And then release the mouse button somewhere outside the element. This would be considered as a click outside the element, therefore removing this element. With this check we only remove the element if we aren't selecting anything
            if (window.getSelection().toString().length === 0)
            {
                showPlainTextEditor = false;
                easyMDEContainer.remove();
                clickOutsideAction.destroy();
            }
        });
    }

    function mountLabelsPopup(e: MouseEvent)
    {
         mount(LabelsPopup, {props: {
            clickEvent: e,
            labelIds: card.labelIds,
            setLabelIds: newLabelIds => {
                card.labelIds = newLabelIds;
            },
            focusOnCardDetailsFunction: focusOnCardDetailsFunction,
            reloadLists
        }, target: document.body, intro: true})
    }
</script>

{#if card !== null}
    <div transition:blur|global bind:this={overlayElement} class="overlay {isCardFullscreen ? 'overlayCardFullscreen': ''}" onclick={() => (window.getSelection().toString().length === 0) && closeCard()} tabindex="1" onkeydown={handleKeyDown}
    >
        <!--Before the `(window.getSelection().toString().length === 0)` check, if we were to press and hold the mouse button to select a part of the description. And then release the mouse button somewhere outside the card. This would be considered as a click outside the card, therefore closing the card. With this check we only close the card if we aren't selecting anything-->

        <div transition:slide|global class="popup {isCardFullscreen ? 'popupCardFullscreen': ''}" onclick={(e) => e.stopPropagation()}>
            <!-- When the user clicks outside the popup, the popup should close. However, when the user clicks on the popup itself, the click event should not be captured by the containing/overlay div. In order to prevent the click event from propagating up to the overlay and triggering the closure of the popup, e.stopPropagation() is called-->
            <div class="titleDiv">
                <textarea
                        bind:value={() => card.title, (newTitle) => card.title = newTitle}
                        placeholder={I18n.t("enterACardTitle")}
                        spellcheck="false"
                        onkeydown={e => (e.key === "Enter") && e.preventDefault()}
                        style={`text-decoration: ${card.complete ? "line-through" : "none"}`}
                ></textarea>
                <!--This `e.key === Enter` check and e.preventDefault if it was true; prevents the user from typing newlines. If they would copy in new lines, they will be visible while editing the textarea.-->
                <svg onclick={closeCard} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5" >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <div class="separator"
            >
                {I18n.t("createdOn") + (new Date(card.creationDate)).toLocaleDateString(SaveLoadManager.getData().displayLanguage, {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                })}
            </div>
            <div class="bottomPart">
                <div class="cardMainAreaHolder">
                    <div class="labels">
                        {#key invalidateLabels.value}
                            {#each card.labelIds.map(labelId => SaveLoadManager.getData().getLabel(selectedBoardId.value, labelId)) as label}
                                <div style="background-color: {label.color}"
                                     onclick={mountLabelsPopup}
                                >
                                    <span style="color: {label.titleColor}">
                                        {label.title}
                                    </span>
                                </div>
                            {/each}
                        {/key}
                    </div>
                    {#if card.dueDate !== null}
                        <button class="dueDate"
                                title={I18n.t("dueDate")}
                                class:dueDateOrange={parseInt(card.dueDate) - Date.now() < 86400000 && Date.now() <= parseInt(card.dueDate)}
                                class:dueDateRed={Date.now() > parseInt(card.dueDate)}
                                style={`background-color: ${card.complete ? "var(--success)" : ""}`}
                                onclick={e => mount(DueDatePopup, {props: {clickEvent: e, dueDate: card.dueDate, setDueDate: newDueDate => card.dueDate = newDueDate, focusOnCardDetailsFunction: focusOnCardDetailsFunction}, target: document.body, intro: true})}
                        >
                            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"></path></svg>
                            <span>
                                    {`${(new Date(parseInt(card.dueDate))).toLocaleString(SaveLoadManager.getData().displayLanguage, {dateStyle: "full", timeStyle: "short", hourCycle: 'h23'})}`}
                            </span>
                        </button>
                    {:else if card.dueDate === null && card.complete}
                        <button class="completed"
                                in:slide
                                out:slide
                                title={I18n.t("completed")}
                                style="background-color: var(--success)"
                                onclick={e => card.complete = !card.complete}
                        >
                            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"></path></svg>
                            <span>
                                {I18n.t("completed")}
                            </span>
                        </button>
                    {/if}
                    {#if showPlainTextEditor}
                        <textarea bind:this={markdownTextArea}>{card.description}</textarea>
                    {:else}
                        <!-- Without this key, the description of the card wouldn't update when we clicked on a Takma link in the description of a card. All other aspects of the card except for the description would be updated, checklists, title etc. But the description would still show the description of the original card where the user clicked on the Takma link. -->
                        {#key card}
                            <TipTap
                                    bind:cardDescription={card.description}
                                    {getImageUrl}
                                    switchToPlainTextEditor={() => showPlainTextEditor = true}
                            />
                        {/key}
                    {/if}
                    <CheckLists bind:this={checkListComponent} bind:checklists={card.checklists} {focusOnCardDetailsFunction}/>
                    <Attachments bind:attachments={card.attachments} addAttachmentFunction={addAttachment} {focusOnCardDetailsFunction} {isCardFullscreen}/>
                </div>
                <div class="cardActionsHolder">
                    <span>
                        {I18n.t("addToCard")}
                    </span>
                    <button title={I18n.t("labels")}
                            onclick={mountLabelsPopup}
                    >
                        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path><path d="M7 7h.01"></path></svg>
                        <span>
                            {I18n.t("labels")}
                        </span>
                    </button>
                    <button title={I18n.t("checklist")}
                            onclick={() => {
                                const newChecklist = {id: crypto.randomUUID(), title: "", todos: [], creationDate: Date.now()};

                                card?.checklists.push(newChecklist);

                                checkListComponent.addTodoItem(newChecklist.id); // This ensures that once the checklist is added to the DOM, a new todo item is created immediately, and the todo item\'s title is focused/selected. This allows a user to type a todo right away, rather than having to create a todo item first after creating the checklist.
                            }}
                    >
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="12 12 488 488" xmlns="http://www.w3.org/2000/svg"><path d="M168.531 215.469l-29.864 29.864 96 96L448 128l-29.864-29.864-183.469 182.395-66.136-65.062zm236.802 189.864H106.667V106.667H320V64H106.667C83.198 64 64 83.198 64 106.667v298.666C64 428.802 83.198 448 106.667 448h298.666C428.802 448 448 428.802 448 405.333V234.667h-42.667v170.666z"></path></svg>
                        <span>
                            {I18n.t("checklist")}
                        </span>
                    </button>
                    <button title={I18n.t("dueDate")}
                            onclick={e => mount(DueDatePopup, {props: {clickEvent: e, dueDate: card.dueDate, setDueDate: newDueDate => card.dueDate = newDueDate, focusOnCardDetailsFunction: focusOnCardDetailsFunction}, target: document.body, intro: true})}
                    >
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"></path></svg>
                        <span>
                            {I18n.t("dueDate")}
                        </span>
                    </button>
                    <button title={I18n.t("attachments")} id="cardDetailsAttachmentsButton"
                            onclick={addAttachment}
                    >
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke-width="2" d="M22,12 C22,12 19.0000009,15.0000004 13.0000004,21.0000004 C6.99999996,27.0000004 -2.00000007,18.0000004 3.99999994,12.0000004 C9.99999996,6.00000037 9,7.00000011 13,3.00000008 C17,-0.999999955 23,4.99999994 19,9.00000005 C15,13.0000002 12.0000004,16.0000007 9.99999995,18.0000004 C7.99999952,20 5,17 6.99999995,15.0000004 C8.99999991,13.0000007 16,6 16,6"></path></svg>
                        <span>
                            {I18n.t("attachments")}
                        </span>
                    </button>
                    <button title={I18n.t("cover")} id="cardDetailsCoverButton"
                            onclick={setCoverImage}
                    >
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z"></path><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H3V5h18v11z"></path></svg>
                        <span>
                            {I18n.t("cover")}
                        </span>
                    </button>
                    <br>
                    <span>
                        {I18n.t("actions")}
                    </span>
                    <button title={card.complete ? I18n.t("markAsIncomplete") : I18n.t("markAsComplete")}
                            onclick={() => card.complete = !card.complete}
                    >
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"></path></svg>
                        <span>
                            {card.complete ? I18n.t("markAsIncomplete") : I18n.t("markAsComplete")}
                        </span>
                    </button>
                    <button title={I18n.t("link")} id="cardDetailsCopyLinkButton"
                            onclick={async () => {
                                let linkToThisCard = `takma://${selectedBoardId.value}/${card.id}`;
                                await writeText(linkToThisCard);

                                let textInClipboard = await readText();
                                if (textInClipboard === linkToThisCard)
                                {
                                    toast(I18n.t("cardLinkCopiedToClipboard"));
                                }
                                else
                                {
                                    toast.error(I18n.t("clipboardCopyCardErrorLink") + linkToThisCard);
                                }
                            }}
                    >
                        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        <span>
                            {I18n.t("link")}
                        </span>
                    </button>
                    <hr style="margin: 0">
                    <button id="deleteButton"  title={I18n.t("delete")}
                            onclick={deleteCard}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clip-rule="evenodd" />
                        </svg>
                        <span>
                            {I18n.t("delete")}
                        </span>
                    </button>
                </div>
            </div>
        </div>
        <div class="fullScreenButton"
             onclick={toggleFullscreen}
        >
            {#if isCardFullscreen}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">  <path stroke-linecap="round" stroke-linejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" /> </svg>
            {:else}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
            {/if}
        </div>
    </div>
    <Toaster richColors theme={document.documentElement.style.getPropertyValue("color-scheme")}/>
{/if}

<style>
    .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);

        transition: all 0.3s;
    }

    :global(.overlayCardFullscreen) {
        background-color: var(--background-color) !important;
    }

    :global(.overlayScreenMaximized) {
        border-radius: 0;
    }

    .popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: var(--background-color);
        padding: 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.3);

        max-height: 80vh;
        overflow: auto;
        scroll-padding: 3.5em; /* Makes it so that EasyMDE (which uses CodeMirror) scrolls the line the cursor is on fully into view, when the user types at the bottom of the card's description. Previously CodeMirror didn't scroll far enough causing only the top half of the line to be visible. */

        transition: all 0.3s;
        min-width: 1em;
        min-height: 1em;
    }

    :global(.popupCardFullscreen) {
        top: 52% !important;
        padding-top: 0 !important;
        min-height: calc(100vh - 4em) !important;
        min-width: calc(100vw - 2.5em) !important;
        box-shadow: none !important;
    }

    .titleDiv {
        display: flex;
        gap: 1em;
        justify-content: space-between;
        align-items: center;
    }

    .titleDiv svg {
        height: 2em;
        cursor: pointer;
        stroke: var(--unselected-button);
        transition: 0.2s;
    }

    .titleDiv textarea {
        padding: 0.5em 0.25em;
        border-radius: 0.5em;
        border: 2px solid transparent;
        background: none;
        transition: 0.3s;
        flex-grow: 1;
        width: 100%;
        font-size: x-large;
        font-weight: bold;
        resize: none;
        display: block;
        overflow: hidden;
        min-height: 1em;
        min-width: min(28em, 70vw);
        word-break: break-word;
        field-sizing: content;
    }

    .titleDiv textarea::placeholder {
        color: gray;
    }

    .titleDiv textarea:focus, .titleDiv textarea:hover {
        border: 2px solid var(--accent);
        box-shadow: 0 0 0 0;
    }

    .titleDiv svg:hover {
        stroke: var(--selected-button);
    }

    hr {
        border: 1px solid var(--border);
    }

    .separator {
        display: flex;
        align-items: center;
        text-align: center;
        transition: 0.3s;
        color: transparent;
        margin-bottom: 0.25em;
    }

    .separator:hover {
        color: var(--unselected-button);
        font-size: medium;
    }

    .separator::before,
    .separator::after {
        content: '';
        flex: 1;
        border-bottom: 1.5px solid var(--border);
        transition: 0.3s;
    }

    .separator::before {
        margin-right: -100%; /* We doen dit zodat wanneer we niet hoveren, de border één volle lijn is. Je zou ook kunnen zeggen waarom zet je de font size niet op 0 in de div. Dan is er "geen tekst" en zal de border ook één volle lijn zijn. Maar met font size 0 is de div zogezegd leeg en kan je er dus alleen maar hoveren door op de heel dunne border te klikken. Dus doen we het door de tekst by default transparant te maken, tenzij we hoveren. De tekst neemt dan echter nog altijd plaats in, maar door de margin hier -100% te doen, wordt de border toch één volle lijn (eigenlijk gaat de border dan door/over de tekst, maar sinds die transparant is zien we dat toch niet. En wanneer de tekst dan wel weer zichtbaar is on hover, doen we de -100% margin weg. */
    }

    .separator:hover:not(:empty)::before {
        margin-right: .25em;
    }

    .separator:hover:not(:empty)::after {
        margin-left: .25em;
    }

    .bottomPart {
        display: flex;
        gap: 1em;
        justify-content: space-between;
    }

    .cardMainAreaHolder {
        width: 100%;
    }

    .cardActionsHolder {
        width: 11em;
        display: flex;
        flex-direction: column;
        gap: 0.5em;
        position: sticky;
        top: 0;
        height: fit-content;
    }

    .cardActionsHolder button {
        width: 100%;
        min-height: 2.5em;
        border: none;
        font-size: medium;
        display: flex;
        align-items: center;
        gap: 0.75em;
        border-radius: 4px;
        cursor: pointer;
        background-color: var(--border);
        transition: 0.3s;
    }

    .cardActionsHolder button svg {
        min-width: 1.25em;
        height: 1.25em;
    }

    .cardActionsHolder button span {
        overflow: hidden;
        text-overflow: ellipsis;
        text-align: left;
        margin: 0.25em 0;
    }

    .cardActionsHolder button:hover {
        background-color: var(--unselected-button);
    }

    #deleteButton:hover {
        background-color: var(--danger);
        color: white;
    }

    :global(code > *) {
        font-family: ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace;
    }

    .labels {
        padding-bottom: 0.5em;
        display: flex;
        gap: 0.5em;
        flex-wrap: wrap;
    }

    .labels:empty {
        padding: 0;
    }

    .labels div {
        height: 1.5em;
        min-width: 2.5em;
        border-radius: 4px;
        cursor: pointer;
        transition: 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .labels div:hover {
        filter: brightness(70%);
    }

    .labels div span {
        padding: 0 0.5em;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        max-width: 30em;
    }

    .dueDate, .completed {
        display: flex;
        background-color: var(--border);
        border-radius: 4px;
        border: none;
        align-items: center;
        gap: 0.5em;
        cursor: pointer;
        transition: 0.3s;
        height: 2em;
        font-size: medium;
        width: 100%;
        justify-content: center;
        margin-bottom: 0.5em;
        color: white;
    }

    .dueDateRed {
        background-color: var(--danger);
    }

    .dueDateOrange {
        background-color: var(--warning);
    }

    .dueDate:hover, .completed:hover {
        filter: brightness(70%);
    }

    .dueDate svg {
        width: 1.5em;
        height: 1.5em;
    }

    .completed svg {
        width: 1.25em;
        height: 1.25em;
    }

    .fullScreenButton {
        display: block;
        position: fixed;
        height: 2.5em;
        width: 2.5em;
        bottom: 0.75em;
        right: 0.75em;
        color: white;
        transition: 0.3s;
        cursor: pointer;
        -webkit-filter: drop-shadow(2px 2px 2px rgba(0, 0, 0, .5));
    }

    .fullScreenButton:hover {
        color: grey;
    }

    /*region Used for styling the EasyMDE window*/
    :global(.CodeMirror) {
        background: transparent !important;
        transition: 0.3s !important;
        border-radius: 0 0 0.5em 0.5em !important;
        border: var(--border) 2px solid !important;
        margin-top: -5em;
    }

    :global(.EasyMDEContainer .CodeMirror .CodeMirror-line) {
        color: var(--main-text);
        word-break: break-word !important;
        white-space: break-spaces !important;
    }

    :global(.EasyMDEContainer .CodeMirror .CodeMirror-line span) {
        color: var(--main-text);
        word-break: break-word !important;
        white-space: break-spaces !important;
    }

    :global(.EasyMDEContainer .CodeMirror .CodeMirror-line .CodeMirror-selectedtext) {
        background: Highlight !important;
        color: HighlightText !important;
    }

    :global(.CodeMirror-selected) {
        background: transparent !important;
    }

    /*Styles code blocks*/
    :global(.cm-s-easymde .cm-comment) {
        background: rgba(var(--main-text-rgb-values), 0.1) !important;
    }

    /*Styles images inside the markdown preview of EasyMDE*/
    :global(span::after) {
        max-width: 30vw !important;
    }

    :global(.CodeMirror-cursor) {
        border-color: var(--main-text) !important;
    }

    :global(.CodeMirror-placeholder) {
        color: var(--main-text) !important;
    }

    :global(.editor-toolbar) {
        border-radius: 0.5em 0.5em 0 0 !important;
        background: var(--border);
        border: var(--border) 2px solid !important;
        top: -1.25em;
        position: sticky !important;
        z-index: 2;
        margin-bottom: 5em;
    }

    :global(.overlayCardFullscreen .editor-toolbar) {
        /* Applies this style only when the card is fullscreen. If the card isn't fullscreen, the `overlayCardFullscreen` class won't be present, so the original `editor-toolbar` styles won't be overwritten by the ones here. */
        top: -0.25em !important;
    }

    :global(.editor-toolbar .separator) {
        border: var(--unselected-button) 1px solid !important;
    }

    :global(.editor-toolbar button) {
        transition: 0.3s;
        color: var(--main-text) !important;
        border: none !important;
    }

    :global(.editor-toolbar button:hover, .editor-toolbar button.active) {
        background-color: var(--unselected-button) !important;
    }
    /*endregion*/
</style>