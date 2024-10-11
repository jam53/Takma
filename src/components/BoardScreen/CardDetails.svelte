<script lang="ts">
    import {blur, slide} from "svelte/transition";
    import {afterUpdate, onDestroy, onMount} from "svelte";
    import {selectedBoardId, selectedCardId} from "../../scripts/stores";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import type {Card, Checklist} from "../../scripts/Board";
    import {clickOutside} from "../../scripts/ClickOutside";
    import {marked} from "marked";
    import DOMPurify from "dompurify";
    import {open} from "@tauri-apps/plugin-shell"
    import {readText, writeText} from "@tauri-apps/plugin-clipboard-manager";
    import hljs from "highlight.js";
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

    export let refreshListsFunction;

    let typing: boolean; //If we are currently typing, we make sure we don't focus in `afterUpdate` on the containing div. Otherwise we would lose focus of whatever element we are typing in, after every keystroke. As for why we focus one the containing div (overlayElement), this is because otherwise we wouldn't be able to detect keyDown events; these are used to check for Esc / Ctrl+W events to close the CardDetails window
    let editingDescription: boolean = false; //We use this to know whether or not we should display the rendered html of the description, or display the <pre> so that the user can edit the description
    //Note: The variables `typing` and `editingDescription` don't necessarily mean the same and should be kept as separate variables. As it is possible that user is typing somewhere on the Card Details screen that isn't the description of the card. For example when editing a checklist.

    let cardToSave: Card; //Rather than saving every single time for every change, we will keep track of the current card in this variable, and once we close the CardDetails window, only then will we save the card to disk.

    let cardDesc; // We use a separate variable, and not `cardToSave.description`. This because in the <pre> where we use this `cardDesc`, if we would use `cardToSave.description`. The content of the <pre> would be updated as we typed, causing weird behaviour like the stuff we typed appearing twice and so on. Doing it this way with a separate variable circumvents that issue

    onMount(() =>
    {
        selectedCardId.subscribe(value =>
        {
            if (value != "" && $selectedCardId != "")
            {
                showPopup = true;
                cardToSave = SaveLoadManager.getData().getCard($selectedBoardId, value);
                cardDesc = cardToSave.description;

                //If the card has no description yet, we enter the description editing "mode" by default. Instead of having requiring the user to click on it.
                if (cardDesc === "")
                {
                    editingDescription = true; //Displays the EasyMDE markdown editor
                    typing = true; //Ensures that we don't lose focus of the EasyMDE markdown editor while typing, otherwise the user might have to refocus by clicking on it after every character they typed
                }
            }
            else
            {
                showPopup = false;
            }
        });
    });

    afterUpdate(() =>
    {
        if (!typing && showPopup)
        {
            overlayElement?.focus(); //If we don't focus on the containing div, which is this `overlayElement`. Then we wont be able to listen to the on:keydown events

            hljs.highlightAll(); //Applies syntax highlighting to codeblocks. We don't need to do this after every update when we are editing the description, only when we are viewing the "rendered" Markdown version of the description. Hence the if.
            //The IDE throws an error for `highlightAll()`, saying it isn't defined. This is fine because we import hljs as so: `import hljs from "highlight.js";`. Which does include the function `highlightAll()`
        }
    });


    function handleKeyDown(e)
    {
        if((e.key === "Escape" || (e.key === "w" && e.ctrlKey)) && SaveLoadManager.getData().onboardingCompleted)
        {
            closeCard();
        }
    }

    function closeCard()
    {
        saveCard();
        refreshListsFunction();
        $selectedCardId = "";
        document.activeElement.blur(); //This should or could help preventing the issue where cards can't be dragged at times.
        clearTimeout(typingTimer);
    }

    function saveCard()
    {
        SaveLoadManager.getData().updateCard(cardToSave, $selectedBoardId, $selectedCardId);
    }

    let showPopup = false;
    let overlayElement;

    //region markedjs custom renderer
    const takmaLinkPatternGlobal = /takma:\/\/([\w-]+)(?:\/([\w-]+))?/ig;
    const takmaLinkPattern = /takma:\/\/([\w-]+)(?:\/([\w-]+))?/i; //Link to a card `takma://<board id>/<card id>`. Link to a board `takma://<board id>`
    // `takma:\/\/` - This part matches the literal characters "takma://" in the string.
    // `([\w-]+)` - This is the first capturing group (`(...)`) and it matches one or more word characters `(\w)` or hyphens (`-`). The hyphen is included within the character set `[\w-]`. Word characters include uppercase and lowercase letters, digits, and underscores. This capturing group captures the board ID.
    // `(?:\/([\w-]+))?` - This is a non-capturing group (`(?:...)`) followed by a question mark ?, which makes it optional. It matches a forward slash (`\/`) followed by one or more word characters or hyphens. The hyphen is included within the character set `[\w-]`. This capturing group captures the card ID, which is also allowed to contain hyphens. The non-capturing group is used because we're not interested in capturing the forward slash itself.
    // `/i` - This is a flag indicating case-insensitive matching. It allows the pattern to match both uppercase and lowercase characters.

    // Create a custom renderer
    const markedCustomRenderer = new marked.Renderer();

    // Override the link rendering function
    markedCustomRenderer.link = function(token) {
        // Check if the link matches your custom pattern
        const match = token.href.match(takmaLinkPattern);

        if (match)
        {
            const boardId = match[1];
            const cardId = match[2];

            let boardTitle;
            let cardTitle;

            let styledLink;

            try
            {
                boardTitle = SaveLoadManager.getData().getBoard(boardId).title;
                cardTitle = SaveLoadManager.getData().getCard(boardId, cardId).title;
            }
            catch (e)
            {
                console.log(e);

                boardTitle = boardTitle ?? I18n.t("boardNotFound");
                cardTitle = cardId === undefined ? "" : I18n.t("cardNotFound");
            }
            finally
            {
                styledLink = `
                <span data-takmalink="${token.href}" class="takma-link">
                    <span data-takmalink="${token.href}" class="takma-linkBoardTitle">${boardTitle}</span>
                    <span data-takmalink="${token.href}" class="takma-linkCardTitle">${cardTitle}</span>
                </span>`;
            }

            return styledLink;
        } else
        {
            // Use the default link rendering for other links
            return marked.Renderer.prototype.link.call(this, token);
        }
    };

    // This function modifies the behavior of how images are rendered by the marked library:
    // - If the image source (href) is an HTTP or HTTPS URL, it remains unchanged.
    // - If the image source is a local file path, it is converted to a URL using the `getImageUrl()` function.
    markedCustomRenderer.image = function(token) {
        token.href = getImageUrl(token.href);
        return marked.Renderer.prototype.image.call(this, token);
    };

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

    const markedJsOptions = {
        mangle: false,
        headerIds: false,
        breaks: true,
        renderer: markedCustomRenderer
    };

    function parseMarkdown(textToParse: string): string
    {
        textToParse = textToParse.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/,""); // remove the most common zerowidth characters from the start of the file

        textToParse = textToParse.replace(/__(.*?)__/g, '<u>$1</u>'); //Add support for underlining with __ __

        let preprocessed = preprocessMarkdown(textToParse);
        let parsedText = marked.parse(preprocessed, markedJsOptions);
        let sanitized = DOMPurify.sanitize(parsedText);

        return sanitized;
    }

    /**
     * Custom preprocessing function to convert custom takmaLink format to valid Markdown links
     * In our custom renderer, we overwrite the link function `markedCustomRenderer.link`. But since takma://, unlike http:// and https:// isn't considered a link; that `markedCustomRenderer.link` wouldn't "catch" our takmaLinks. So here we make a markdown link from the takma links `[takmaLink](takmaLink)`. This way the parser considers it a link
     */
    function preprocessMarkdown(markdown)
    {
        return markdown.replaceAll(takmaLinkPatternGlobal, '[$&]($&)');
    }

    function handleDescriptionHolderClick(e)
    {
        if (e.target.dataset.takmalink)
        {//Our custom takmaLinks get turned in a SPAN tag which has 2 child SPAN elements, all of which have `takmalink` as a custom data attribute. So if the target contains a `takmalink` data attribute, it means we clicked on a takmaLink
            e.stopPropagation(); //Otherwise we start editing the description when we click on this button

            let takmaLink = e.target.dataset.takmalink;

            let match = takmaLink.match(takmaLinkPattern);
            let boardId = match[1];
            let cardId = match[2];

            let boardTitle;
            let cardTitle;

            try
            {
                boardTitle = SaveLoadManager.getData().getBoard(boardId).title;
                cardTitle = SaveLoadManager.getData().getCard(boardId, cardId).title;
            }
            catch (e)
            {
                if (boardTitle === undefined)
                {
                    new PopupWindow({props: {description: I18n.t("boardIdNotFound", takmaLink.toString()), buttonType: "ok"}, target: document.body, intro: true});
                }
                else if (boardTitle !== undefined && cardId !== undefined && cardTitle === undefined)
                {
                    new PopupWindow({props: {description: I18n.t("cardIdNotFound", takmaLink.toString()), buttonType: "ok"}, target: document.body, intro: true});
                }
            }
            finally
            {
                if (boardTitle != undefined && cardTitle != undefined)
                {
                    $selectedBoardId = boardId;
                    $selectedCardId = cardId;
                }
                else if (boardTitle != undefined)
                {
                    $selectedBoardId = boardId;
                    $selectedCardId = "";
                }

                refreshListsFunction();
            }
        }
        else if (e.target.tagName === "A")
        {
            e.stopPropagation(); //Otherwise we start editing the description when we click on a link

            open(e.target.href); //Op deze manier wordt de link in de default browser van de gebruiker geopend. Als we dit niet doen wordt de link geopend in het Tauri venster
            e.preventDefault(); //Als we dit niet doen, wordt de links alsnog in het Tauri venster geopend, nadat het is geopend geweest in de default browser.
        }
        else
        {
            cardDesc = cardToSave.description;
            editingDescription = true;
            typing = true;
        }
    }

    function refreshCardFunction()
    {
        cardToSave = cardToSave;
    }

    $: overlayElement && applyMaximizedNotMaximizedStyleClasses();
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

    function amountOfTodosInChecklist(checklist: Checklist, completedOnly = false)
    {
        return completedOnly ? (checklist.todos.filter(todo => todo.completed)).length : checklist.todos.length;
    }

    let checkListComponent;

    let attachmentsComponent;
    async function addAttachment()
    {
        const selectedFile = await openDialog({
            multiple: true,
        });

        if (Array.isArray(selectedFile))
        {//User selected multiple files
            for (let file of selectedFile)
            {
                let savedFilePath = await saveAbsoluteFilePathToSaveDirectory(file, $selectedBoardId); //We save the selected file to Takma's data folder, this way we can still access it even if the original file is deleted/moved
                cardToSave.attachments.push(savedFilePath);
            }
        }
        else if (selectedFile !== null)
        {//User selected a single file
            let savedFilePath = await saveAbsoluteFilePathToSaveDirectory(selectedFile, $selectedBoardId); //We save the selected file to Takma's data folder, this way we can still access it even if the original file is deleted/moved
            cardToSave.attachments.push(savedFilePath);
        }

        cardToSave = cardToSave; //If we don't do this, the function below `attachmentsComponent.refreshComponent()` will cause the component to refresh but it will still use the "old" values of the cardToSave variable because it would think it hasn't changed. So the component would refresh but nothing would visibly change because the old value of cardToSave would still be used
        saveCard();
        attachmentsComponent.refreshComponent();
    }

    let unlisten;
    (async () => {unlisten = await listen('tauri://drag-drop', async event => {
        if ($selectedCardId != "") //We only want to react to this filedrop event if there is a card selected. Otherwise it would mean the drop event was meant to change the background image of the board. Rather than to drop attachements onto a card.
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
            let savedPath = await saveAbsoluteFilePathToSaveDirectory(droppedFile, $selectedBoardId);
            cardToSave.attachments.push(savedPath);
        }

        cardToSave = cardToSave; //If we don't do this, the function below `attachmentsComponent.refreshComponent()` will cause the component to refresh but it will still use the "old" values of the cardToSave variable because it would think it hasn't changed. So the component would refresh but nothing would visibly change because the old value of cardToSave would still be used
        saveCard();
        attachmentsComponent.refreshComponent()
    }

    /**
     * Prompts the user with a file picker to select a cover image, or removes the current cover image if there was already a cover image set for this card.
     */
    async function setCoverImage()
    {
        if (cardToSave.coverImage !== "")
        {
            await removeFileFromSaveDirectory(cardToSave.coverImage);
            cardToSave.coverImage = "";
            toast(I18n.t("removeCardCoverImage"));
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
                cardToSave.coverImage = await saveAbsoluteFilePathToSaveDirectory(selected, $selectedBoardId); //We save the selected file to Takma's data folder, this way we can still access it even if the original file is deleted/moved

                toast(I18n.t("addCardCoverImage"))
            }
        }
        saveCard();
    }

    function deleteCard()
    {
        SaveLoadManager.getData().deleteCard($selectedBoardId, $selectedCardId);
        refreshListsFunction();
        $selectedCardId = "";
    }

    let isCardFullscreen = SaveLoadManager.getData().cardsFullscreen;
    let popupElement;
    function toggleFullscreen()
    {
        isCardFullscreen = !isCardFullscreen;

        if (isCardFullscreen)
        {
            overlayElement.classList.add("overlayCardFullscreen");
            popupElement.classList.add("popupCardFullscreen");

            Array.from(document.getElementsByClassName("titleAndActionsHolder")).forEach(attachment => attachment.classList.add("titleAndActionsHolderCardFullscreen"));
        }
        else
        {
            overlayElement.classList.remove("overlayCardFullscreen");
            popupElement.classList.remove("popupCardFullscreen");

            Array.from(document.getElementsByClassName("titleAndActionsHolder")).forEach(attachment => attachment.classList.remove("titleAndActionsHolderCardFullscreen"));
        }

        SaveLoadManager.getData().cardsFullscreen = isCardFullscreen;
    }
    $: overlayElement && toggleFullscreen(); //When we open the card, we wait until the overlayElement AKA the UI is loaded. Then we proceed to call the toggleFullscreen() function twice. This way the necessary styleclasses get applied/removed. Should we call it just once, then we would toggle the fullscreen state. Which is not what we want, we just want to apply/remove the necessary styleclasses. So we call the function a second time to toggle back the original fullscreen state of the card.
    $: overlayElement && toggleFullscreen();

    let typingTimer;                //timer identifier
    let doneTypingInterval = 5000;  //time in ms
    //This function should be added as a "keyup" event listener to whatever element that should be used to check whether or not the user stopped typing
    function waitUntilUserStoppedTyping(callback)
    {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(callback, doneTypingInterval);
    }

    let markdownTextArea;
    $: markdownTextArea && initializeEasyMDE();
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
                    let path = (await saveFileToSaveDirectory(file, $selectedBoardId)).replace(/\\/g, '/'); //Ensure the file path uses forward slashes for Markdown image links, converting any backslashes from Windows file paths.
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

        easyMDE.codemirror.on("change", () => cardToSave.description = easyMDE.value().trim());
        easyMDE.codemirror.on("focus", () => typing = true);
        easyMDE.codemirror.on("blur", () => typing = false);
        easyMDE.codemirror.on("keyup", () => waitUntilUserStoppedTyping(saveCard));

        //Remove the EasyMDE element from the DOM once we show the rendered markdown AKA click outside the EasyMDEContainer
        let easyMDEContainer = document.getElementsByClassName("EasyMDEContainer")[0];
        const clickOutsideAction =  clickOutside(easyMDEContainer);
        easyMDEContainer.addEventListener('click_outside', () => {
            //The `(window.getSelection().toString().length === 0)` check ensures that selecting text won't fire a `click_outside` event. If we were to press and hold the mouse button to select a part of the description. And then release the mouse button somewhere outside the element. This would be considered as a click outside the element, therefore removing this element. With this check we only remove the element if we aren't selecting anything
            if (window.getSelection().toString().length === 0)
            {
                editingDescription = false;
                typing = false;
                easyMDEContainer.remove();
                clickOutsideAction.destroy();
            }
        });
    }
</script>

{#if showPopup}
    <div transition:blur|global bind:this={overlayElement} class="overlay" on:click={() => (window.getSelection().toString().length === 0) && closeCard()} tabindex="1" on:keydown|stopPropagation={handleKeyDown}
         on:dragover|preventDefault on:dragenter|preventDefault on:dragleave|preventDefault
    >
        <!--Before the `(window.getSelection().toString().length === 0)` check, if we were to press and hold the mouse button to select a part of the description. And then release the mouse button somewhere outside the card. This would be considered as a click outside the card, therefore closing the card. With this check we only close the card if we aren't selecting anything-->

        <div bind:this={popupElement} transition:slide|global class="popup" on:click={(e) => e.stopPropagation()}>
            <!-- When the user clicks outside the popup, the popup should close. However, when the user clicks on the popup itself, the click event should not be captured by the containing/overlay div. In order to prevent the click event from propagating up to the overlay and triggering the closure of the popup, e.stopPropagation() is called-->
            <div class="titleDiv">
                <span role="textbox" contenteditable="plaintext-only" data-txt-content={I18n.t("enterACardTitle")} spellcheck="false"
                      on:input={(e) => cardToSave.title = e.target.textContent}
                      on:focus={() => typing = true}
                      on:focusout={() => typing = false}
                      on:keydown={e => (e.keyCode === 13) && e.preventDefault()}
                      on:keyup={() => waitUntilUserStoppedTyping(saveCard)}
                >
<!--This keycode 13 check and e.preventDefault if it was true; prevents the user from typing newlines. If they would copy in new lines, they will be visible while editing the span. But once we close the editing of the span and reopen it, the newline will be gone-->
                    {SaveLoadManager.getData().getCard($selectedBoardId, $selectedCardId).title}
                </span>
<!--In principe is het logischer dat we {cardToSave.title} schrijven in plaats van {SaveLoadManager.getData().getCard($selectedBoardId, $selectedCardId).title}. Maar dan hadden we het probleem dat wanneer de kaart nog geen description/titel had. Dat wanneer we een titel begonnen te typen elke toetsaanslag dubbel in de span zichtbaar was. Waarschijnlijk omdat we in on:input de waarde van cardToSave.title setten en dan die hier weer toonden. Op deze manier met de SaveLoadManager hebben we geen last meer van die bug-->
                <svg on:click={closeCard} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5" >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <div class="separator"
            >
                {I18n.t("createdOn") + (new Date(cardToSave.creationDate)).toLocaleDateString(SaveLoadManager.getData().displayLanguage, {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                })}
            </div>
            <div class="bottomPart">
                <div class="cardMainAreaHolder">
                    {#if cardToSave.dueDate !== null}
                        <button class="dueDate"
                                title={I18n.t("dueDate")}
                                class:dueDateOrange={parseInt(cardToSave.dueDate) - Date.now() < 86400000 && Date.now() <= parseInt(cardToSave.dueDate)}
                                class:dueDateRed={Date.now() > parseInt(cardToSave.dueDate)}
                                on:click={e => new DueDatePopup({props: {mouseClickEvent: e, cardToSave: cardToSave, refreshCardFunction: refreshCardFunction, focusOnCardDetailsFunction: focusOnCardDetailsFunction, saveCardFunction: saveCard}, target: document.body, intro: true})}
                        >
                            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"></path></svg>
                            <span>
                                    {`${(new Date(parseInt(cardToSave.dueDate))).toLocaleString(SaveLoadManager.getData().displayLanguage, {dateStyle: "full", timeStyle: "short", hourCycle: 'h23'})}`}
                            </span>
                        </button>
                    {/if}
                    <div class="labels">
                        {#each cardToSave.labelIds.map(labelId => SaveLoadManager.getData().getLabel($selectedBoardId, labelId)) as label}
                            <div style="background-color: {label.color}"
                                 on:click={e => new LabelsPopup({props: {mouseClickEvent: e, cardToSave: cardToSave, refreshCardFunction: refreshCardFunction, focusOnCardDetailsFunction: focusOnCardDetailsFunction, saveCardFunction: saveCard}, target: document.body, intro: true})}
                            >
                                <span style="color: {label.titleColor}">
                                    {label.title}
                                </span>
                            </div>
                        {/each}
                    </div>
                    {#if editingDescription}
                        <textarea bind:this={markdownTextArea}>{cardDesc}</textarea>
                    {:else}
                        <div class="renderedDescriptionHolder markdown-body"
                             on:click={handleDescriptionHolderClick}
                        >
                            {@html parseMarkdown(cardToSave.description)}
                        </div>
                        {void saveCard() ?? ""}
                        <!-- The void operator evaluates the given expression and then returns undefined. Then with the nullish operator we return an empty string when it's undefined, which will always be the case. This way we can execute some code in our html, without displaying anything in the UI-->
                    {/if}
                    <CheckLists bind:this={checkListComponent} cardToSave={cardToSave} setTypingFunction={bool => typing = bool} amountOfTodosInChecklistFunction={amountOfTodosInChecklist} saveCardFunction={saveCard} focusOnCardDetailsFunction={focusOnCardDetailsFunction}/>
                    <Attachments bind:this={attachmentsComponent} cardToSave={cardToSave} addAttachmentFunction={addAttachment} saveCardFunction={saveCard} focusOnCardDetailsFunction={focusOnCardDetailsFunction}/>
                </div>
                <div class="cardActionsHolder">
                    <span>
                        {I18n.t("addToCard")}
                    </span>
                    <button title={I18n.t("labels")}
                            on:click={e => new LabelsPopup({props: {mouseClickEvent: e, cardToSave: cardToSave, refreshCardFunction: refreshCardFunction, focusOnCardDetailsFunction: focusOnCardDetailsFunction, saveCardFunction: saveCard}, target: document.body, intro: true})}
                    >
                        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path><path d="M7 7h.01"></path></svg>
                        <span>
                            {I18n.t("labels")}
                        </span>
                    </button>
                    <button title={I18n.t("checklist")}
                            on:click={() => {
                                const newChecklist = {id: crypto.randomUUID(), title: "", todos: []};

                                cardToSave.checklists.push(newChecklist);
                                cardToSave = cardToSave;

                                checkListComponent.addTodoItem(newChecklist); //Dit zorgt ervoor dat wanneer de checklist eenmaal toegevoegd is aan de DOM, er direct een nieuw todo item wordt aangemaakt waarvan de titel/content direct wordt gefocused/geselecteerd. Hierdoor kan een gebruiker direct een todo toevoegen aan de checklist
                            }}
                    >
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="12 12 488 488" xmlns="http://www.w3.org/2000/svg"><path d="M168.531 215.469l-29.864 29.864 96 96L448 128l-29.864-29.864-183.469 182.395-66.136-65.062zm236.802 189.864H106.667V106.667H320V64H106.667C83.198 64 64 83.198 64 106.667v298.666C64 428.802 83.198 448 106.667 448h298.666C428.802 448 448 428.802 448 405.333V234.667h-42.667v170.666z"></path></svg>
                        <span>
                            {I18n.t("checklist")}
                        </span>
                    </button>
                    <button title={I18n.t("dueDate")}
                            on:click={e => new DueDatePopup({props: {mouseClickEvent: e, cardToSave: cardToSave, refreshCardFunction: refreshCardFunction, focusOnCardDetailsFunction: focusOnCardDetailsFunction, saveCardFunction: saveCard}, target: document.body, intro: true})}
                    >
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path><path d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"></path></svg>
                        <span>
                            {I18n.t("dueDate")}
                        </span>
                    </button>
                    <button title={I18n.t("attachments")} id="cardDetailsAttachmentsButton"
                            on:click={addAttachment}
                    >
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke-width="2" d="M22,12 C22,12 19.0000009,15.0000004 13.0000004,21.0000004 C6.99999996,27.0000004 -2.00000007,18.0000004 3.99999994,12.0000004 C9.99999996,6.00000037 9,7.00000011 13,3.00000008 C17,-0.999999955 23,4.99999994 19,9.00000005 C15,13.0000002 12.0000004,16.0000007 9.99999995,18.0000004 C7.99999952,20 5,17 6.99999995,15.0000004 C8.99999991,13.0000007 16,6 16,6"></path></svg>
                        <span>
                            {I18n.t("attachments")}
                        </span>
                    </button>
                    <button title={I18n.t("cover")} id="cardDetailsCoverButton"
                            on:click={setCoverImage}
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
                    <button title={I18n.t("link")} id="cardDetailsCopyLinkButton"
                            on:click={async () => {
                                let linkToThisCard = `takma://${$selectedBoardId}/${cardToSave.id}`
                                await writeText(linkToThisCard);

                                let textInClipboard = await readText();
                                if (textInClipboard === linkToThisCard)
                                {
                                    toast(I18n.t("cardLinkCopiedToClipboard"))
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
                            on:click={deleteCard}
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
             on:click|stopPropagation={toggleFullscreen}
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
        border-radius: 10px;

        transition: all 0.3s;
    }

    :is(.overlayCardFullscreen) {
        background-color: var(--background-color);
    }

    :is(.overlayScreenMaximized) {
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

    :is(.popupCardFullscreen) {
        top: 52%;
        padding-top: 0;
        min-height: calc(100vh - 4em);
        min-width: calc(100vw - 2.5em);
        background-color: transparent;
        box-shadow: none;
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

    .titleDiv span {
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
        cursor: text;
        display: block;
        overflow: hidden;
        min-height: 1em;
        min-width: min(28em, 70vw);
        word-break: break-word;
    }

    .titleDiv span[contenteditable]:empty::before {
        content: attr(data-txt-content);
        color: gray;
    }

    .titleDiv span:focus, .titleDiv span:hover {
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

    .renderedDescriptionHolder {
        transition: 0.3s;
        border: 2px solid transparent;
        border-radius: 0.5em;
        min-height: 3em;
        padding: 0.5em 0.25em;
    }

    .renderedDescriptionHolder:hover {
        border: 2px solid var(--accent);
        box-shadow: 0 0 0 0;
        cursor: pointer;
    }

    :global(.renderedDescriptionHolder *:first-child) {
        margin-top: 0;
    }

    :global(.renderedDescriptionHolder *) {
        word-break: break-word;
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
        height: 2.5em;
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
        min-width: 1em;
        height: 1.25em;
    }

    .cardActionsHolder button span {
        overflow: hidden;
        text-overflow: ellipsis;
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

    :global(.markdown-body .takma-link) {
        background: transparent;
        border: 2px solid var(--border);
        border-radius: 4px;
        align-items: center;
        padding: 0 0 1px 0;
        cursor: pointer;
        min-height: 1em;
        margin-right: 0.3em;
    }

    :global(.markdown-body .takma-linkBoardTitle) {
        background: var(--border);
        padding: 0.25em;
        text-transform: uppercase;
        margin: 0;
        font-size: small;
        font-weight: bold;
        min-height: 1em;
        height: 100%;
        word-break: break-all;
    }

    :global(.markdown-body .takma-linkCardTitle) {
        color: var(--accent);
        font-style: italic;
        min-height: 1em;
        min-width: 2em;
        word-break: break-all;
        padding: 0 0.5em 0 0.25em;
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

    .dueDate {
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
    }

    .dueDateRed {
        background-color: var(--danger);
        color: white;
    }

    .dueDateOrange {
        background-color: var(--warning);
        color: white;
    }

    .dueDate:hover {
        filter: brightness(70%);
    }

    .dueDate svg {
        width: 1.5em;
        height: 1.5em;
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
        top: -0.25em;
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