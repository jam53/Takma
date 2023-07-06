<script lang="ts">
    import {blur, slide} from "svelte/transition";
    import {afterUpdate, onMount} from "svelte";
    import {selectedBoardId, selectedCardId} from "../../scripts/stores";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import type {Card} from "../../scripts/Board";
    import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification';
    import {clickOutside} from "../../scripts/ClickOutside";
    import {marked} from "marked";
    import DOMPurify from "dompurify";
    import {open} from "@tauri-apps/api/shell"
    import {readText, writeText} from "@tauri-apps/api/clipboard";

    export let refreshListsFunction;

    let typing: boolean; //If we are currently typing, we make sure we don't focus in `afterUpdate` on the containing div. Otherwise we would lose focus of whatever element we are typing in, after every keystroke. As for why we focus one the containing div (overlayElement), this is because otherwise we wouldn't be able to detect keyDown events; these are used to check for Esc / Ctrl+W events to close the CardDetails window
    let cardToSave: Card; //Rather than saving every single time for every change, we will keep track of the current card in this variable, and once we close the CardDetails window, only then will we save the card to disk.

    let cardDesc; // We use a separate variable, and not `cardToSave.description`. This because in the <pre> where we use this `cardDesc`, if we would use `cardToSave.description`. The content of the <pre> would be updated as we typed, causing weird behaviour like the stuff we typed appearing twice and so on. Doing it this way with a separate variable circumvents that issue

    let editingDescription: boolean = false; //We use this to know whether or not we should display the rendered html of the description, or display the <pre> so that the user can edit the description

    onMount(() =>
    {
        selectedCardId.subscribe(value =>
        {
            if (value != "" && $selectedCardId != "")
            {
                showPopup = true;
                cardToSave = SaveLoadManager.getData().getCard($selectedBoardId, value);
                cardDesc = cardToSave.description;
                editingDescription = cardDesc === ""; //If the card has no description yet, we enter the description editing "mode" by default. Instead of having requiring the user to click on it.
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
            overlayElement && overlayElement.focus(); //If we don't focus on the containing div, which is this `overlayElement`. Then we wont be able to listen to the on:keydown events
        }

        if (!typing)
        {
            hljs.highlightAll(); //Applies syntax highlighting to codeblocks. We don't need to do this after every update when we are editing the description, only when we are viewing the "rendered" Markdown version of the description. Hence the if.
            //The IDE throws an error for `hljs`, saying it isn't defined. This is fine because we import the script in our index.html as `<script src="./src/scripts/highlight.min.js"><\/script>`
        }
    });


    function handleKeyDown(e)
    {
        if(e.key === "Escape" || (e.key === "w" && e.ctrlKey))
        {
            closeCard();
        }
    }

    function closeCard()
    {
        SaveLoadManager.getData().updateCard(cardToSave, $selectedBoardId, $selectedCardId);
        cardToSave = null;
        refreshListsFunction();
        $selectedCardId = "";
    }

    let showPopup = false;
    let overlayElement;

    async function showNotification(message: string)
    {
        let permissionGranted = await isPermissionGranted();
        if (!permissionGranted)
        {
            const permission = await requestPermission();
            permissionGranted = permission === 'granted';
        }
        if (permissionGranted)
        {
            sendNotification({ title: 'Takma', body: message });
        }
    }

    //region markedjs custom renderer
    const takmaLinkPattern = /takma:\/\/([\w-]+)(?:\/([\w-]+))?/i; //Link to a card `takma://<board id>/<card id>`. Link to a board `takma://<board id>`
    // `takma:\/\/` - This part matches the literal characters "takma://" in the string.
    // `([\w-]+)` - This is the first capturing group (`(...)`) and it matches one or more word characters `(\w)` or hyphens (`-`). The hyphen is included within the character set `[\w-]`. Word characters include uppercase and lowercase letters, digits, and underscores. This capturing group captures the board ID.
    // `(?:\/([\w-]+))?` - This is a non-capturing group (`(?:...)`) followed by a question mark ?, which makes it optional. It matches a forward slash (`\/`) followed by one or more word characters or hyphens. The hyphen is included within the character set `[\w-]`. This capturing group captures the card ID, which is also allowed to contain hyphens. The non-capturing group is used because we're not interested in capturing the forward slash itself.
    // `/i` - This is a flag indicating case-insensitive matching. It allows the pattern to match both uppercase and lowercase characters.

    // Create a custom renderer
    const markedCustomRenderer = new marked.Renderer();

    // Override the link rendering function
    markedCustomRenderer.link = function(href, title, text) {
        // Check if the link matches your custom pattern
        const match = href.match(takmaLinkPattern);

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

                boardTitle = boardTitle ?? "%%Board not found";
                cardTitle = cardId === undefined ? "" : "%%Card not found";
            }
            finally
            {
                styledLink = `
                <button id="${href}" class="takma-link">
                    <h4 class="takma-linkBoardTitle">${boardTitle}</h4>
                    <span class="takma-linkCardTitle">${cardTitle}</span>
                </button>`;
            }

            return styledLink;
        } else
        {
            // Use the default link rendering for other links
            return marked.Renderer.prototype.link.call(this, href, title, text);
        }
    };
    //endregion

    const markedJsOptions = {
        mangle: false,
        headerIds: false,
        renderer: markedCustomRenderer
    };

    function parseMarkdown(textToParse: string): string
    {
        textToParse = textToParse.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/,""); // remove the most common zerowidth characters from the start of the file

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
        return markdown.replace(takmaLinkPattern, '[$&]($&)');
    }

    function handleDescriptionHolderClick(e)
    {
        if (e.target.tagName === "A")
        {
            e.stopPropagation(); //Otherwise we start editing the description when we click on a link

            open(e.target.href); //Op deze manier wordt de link in de default browser van de gebruiker geopend. Als we dit niet doen wordt de link geopend in het Tauri venster
            e.preventDefault(); //Als we dit niet doen, wordt de links alsnog in het Tauri venster geopend, nadat het is geopend geweest in de default browser.
        }
        else if (e.target.tagName === "BUTTON" || e.target.tagName === "H4" || e.target.tagName === "SPAN")
        {//Our custom takmaLinks get turned in a button which has a H4 and SPAN in it. So if that is the target, it means we clicked on a takmaLink
            e.stopPropagation(); //Otherwise we start editing the description when we click on this button

            let takmaLink;

            if (e.target.tagName === "BUTTON")
            {
                takmaLink = e.target.id;
            }
            else
            {
                takmaLink = e.target.parentNode.id;
            }

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
                console.log(`Couldn't get title from board and/ord card with takmaLink:${takmaLink}. Meaning the id of either the board/card is wrong.`)
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
        else
        {
            cardDesc = cardToSave.description;
            editingDescription = true;
        }
    }

    let descriptionPreElement;
    $: (editingDescription && descriptionPreElement) && descriptionPreElement.focus();
</script>

{#if showPopup}
    <div transition:blur|global bind:this={overlayElement} class="overlay" on:click={closeCard} tabindex="1" on:keydown|stopPropagation={handleKeyDown}>
        <div transition:slide|global class="popup" on:click={(e) => e.stopPropagation()}>
            <!-- When the user clicks outside the popup, the popup should close. However, when the user clicks on the popup itself, the click event should not be captured by the containing/overlay div. In order to prevent the click event from propagating up to the overlay and triggering the closure of the popup, e.stopPropagation() is called-->
            <div class="titleDiv">
                <span role="textbox" contenteditable
                      on:input={(e) => cardToSave.title = e.target.textContent}
                      on:focus={() => typing = true}
                      on:focusout={() => typing = false}
                      on:keydown={e => (e.keyCode === 13) && e.preventDefault()}
                >
<!--This keycode 13 check and e.preventDefault if it was true; prevents the user from typing newlines. If they would copy in new lines, they will be visible while editing the span. But once we close the editing of the span and reopen it, the newline will be gone-->
                    {cardToSave.title}
                </span>
                <svg on:click={closeCard} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5" >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <hr/>
            <div class="bottomPart">
                <div class="cardMainAreaHolder">
                    {#if editingDescription}
                        <pre role="textbox" contenteditable
                             bind:this={descriptionPreElement}
                              on:input={(e) => cardToSave.description = e.target.innerText.trim()}
                              on:focus={() => typing = true}
                              on:focusout={() => typing = false}
                              on:paste|preventDefault={e => document.execCommand("insertText", false, e.clipboardData.getData("text/plain"))}
                              use:clickOutside
                              on:click_outside={() => editingDescription = false}
                        >{cardDesc}</pre>
                    {:else}
                        <div class="renderedDescriptionHolder markdown-body"
                             on:click={handleDescriptionHolderClick}
                        >
                            {@html parseMarkdown(cardToSave.description)}
                        </div>
                    {/if}
                </div>
                <div class="cardActionsHolder">
                    <span>
                        %%Add to card
                    </span>
                    <button>
                        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path><path d="M7 7h.01"></path></svg>
                        %%Labels
                    </button>
                    <button>
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M168.531 215.469l-29.864 29.864 96 96L448 128l-29.864-29.864-183.469 182.395-66.136-65.062zm236.802 189.864H106.667V106.667H320V64H106.667C83.198 64 64 83.198 64 106.667v298.666C64 428.802 83.198 448 106.667 448h298.666C428.802 448 448 428.802 448 405.333V234.667h-42.667v170.666z"></path></svg>
                        %%Checklist
                    </button>
                    <button>
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke-width="2" d="M22,12 C22,12 19.0000009,15.0000004 13.0000004,21.0000004 C6.99999996,27.0000004 -2.00000007,18.0000004 3.99999994,12.0000004 C9.99999996,6.00000037 9,7.00000011 13,3.00000008 C17,-0.999999955 23,4.99999994 19,9.00000005 C15,13.0000002 12.0000004,16.0000007 9.99999995,18.0000004 C7.99999952,20 5,17 6.99999995,15.0000004 C8.99999991,13.0000007 16,6 16,6"></path></svg>
                        %%Attachment
                    </button>
                    <button>
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="none" d="M0 0h24v24H0V0z"></path><path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H3V5h18v11z"></path></svg>
                        %%Cover
                    </button>
                    <br>
                    <span>
                        %%Actions
                    </span>
                    <button
                            on:click={async () => {
                                let linkToThisCard = `takma://${$selectedBoardId}/${cardToSave.id}`
                                await writeText(linkToThisCard);

                                let textInClipboard = await readText();
                                if (textInClipboard === linkToThisCard)
                                {
                                    showNotification("%%Copied link to this card to clipboard, paste it in any other card's description")
                                }
                                else
                                {
                                    showNotification("%%Couldn't copy link to clipboard, the link to this card is: " + linkToThisCard);
                                }
                            }}
                    >
                        <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        %%Link
                    </button>
                    <hr style="margin: 0">
                    <button id="deleteButton">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                            <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clip-rule="evenodd" />
                        </svg>
                        %%Delete
                    </button>
                </div>
            </div>
        </div>
    </div>
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
        stroke: var(--unselected-buton);
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
        max-width: min(28em, 70vw);
    }

    .titleDiv span[contenteditable]:empty::before {
        content: "%%Enter a title for this card...";
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
        margin-bottom: 1.5em;
    }

    .bottomPart {
        display: flex;
        gap: 1em;
        justify-content: space-between;
    }

    .cardMainAreaHolder {
        width: 100%;
    }

    .cardMainAreaHolder pre {
        padding: 0.5em 0.25em;
        border-radius: 0.5em;
        border: 2px solid transparent;
        background: var(--border);
        transition: 0.3s;
        font-size: medium;
        resize: none;
        cursor: text;
        display: block;
        overflow: hidden;
        min-height: 3em;
        margin: 0;
        word-break: break-word;
        white-space: break-spaces;
    }

    .cardMainAreaHolder pre[contenteditable]:empty::before {
        content: "%%Add a more detailed description using Markdown...";
        color: gray;
    }

    .cardMainAreaHolder pre:focus, .cardMainAreaHolder pre:hover {
        border: 2px solid var(--accent);
        box-shadow: 0 0 0 0;
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

    .cardActionsHolder button:hover {
        background-color: var(--unselected-buton);
    }

    #deleteButton:hover {
        background-color: #c43420;
        color: white;
    }

    .cardActionsHolder button svg {
        height: 1.25em;
    }

    :global(code > *) {
        font-family: ui-monospace,SFMono-Regular,SF Mono,Menlo,Consolas,Liberation Mono,monospace;
    }

    :global(.markdown-body .takma-link) {
        display: inline-flex;
        background: transparent;
        border: 2px solid var(--border);
        border-radius: 4px;
        align-items: center;
        padding: 0 0.5em 0 0;
        gap: 0.5em;
        cursor: pointer;
        min-height: 1em;
    }

    :global(.markdown-body .takma-linkBoardTitle) {
        background: var(--border);
        padding: 0.25em;
        text-transform: uppercase;
        margin: 0;
        font-weight: bold;
        min-height: 1em;
        height: 100%;
        min-width: 1em;
    }

    :global(.markdown-body .takma-linkCardTitle) {
        color: var(--accent);
        font-style: italic;
        min-height: 1em;
        min-width: 2em;
    }
</style>