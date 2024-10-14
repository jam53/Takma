<script lang="ts">
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager.js";
    import {selectedBoardId, selectedCardId} from "../../scripts/stores.js";
    import {tweened} from "svelte/motion";
    import {cubicOut} from "svelte/easing";
    import {slide} from "svelte/transition";
    import {dndzone} from "svelte-dnd-action";
    import {I18n} from "../../scripts/I18n/I18n";
    import PopupWindow from "../PopupWindow.svelte";
    import {onDestroy} from "svelte";
    import {flip} from "svelte/animate";
    import type {Card} from "../../scripts/Board";

    export let cardToSave: Card;

    export let setTypingFunction;
    export let amountOfTodosInChecklistFunction;
    export let saveCardFunction;
    export let focusOnCardDetailsFunction;

    /**
     * This function is used in the value={} field of the <progress> element for the checklists. We pass the id of the checklist and the new value of this progressbar. This function will then tween from the old value in the progressbar to the new value of the progressbar
     */
    function tweenProgressBarValue(checklistId:string, newValue: number): number
    {
        newValue = isNaN(newValue) ? 0 : newValue; //This is the case when the checklist has no todos

        if (document.getElementById(`checklist-progress-${checklistId}`) === null)
        {//As this function is in the value={} field of the <progress>, this function will get called before the <progress> element has been added to the DOM. Because the DOM needs to know which value it has before it gets added to the DOM. So, in this case we immediately return the new value.
            return newValue;
        }
        else //The <progress> element already exists in the DOM, i.e. we checked/unchecked a todoitem or added a new one. And therefore the value of the <progress> changed.
        {
            const prevValue = document.getElementById(`checklist-progress-${checklistId}`).value;

            const progress = tweened(prevValue, {
                duration: 400,
                easing: cubicOut
            });

            progress.subscribe(value => document.getElementById(`checklist-progress-${checklistId}`).value = value);
            progress.subscribe(value => document.getElementById(`checklist-span-${checklistId}`).textContent = Math.round(value * 100) + "%");
            progress.set(newValue);

            return prevValue; //The value of the <progress> will be set/overwritten by the subscribe method of the `progress` store above this line. But since this function needs to return a value for the <progress>, we return the old value.
        }
    }

    let idAddTodoItemButtonToScrollTo = "";
    let idTodoItemToFocus = "";
    /**
     * This function adds a new todo, focuses on it so the title can be edited and scrolls to the bottom of the todo list (i.e./lees: scroll to the "add new todo item" button of that checklist.
     */
    export function addTodoItem(checklist)
    {
        const newTodoId = crypto.randomUUID();
        checklist.todos.push({id: newTodoId, completed: false, content: ""});

        idAddTodoItemButtonToScrollTo = `addTodoButton-${checklist.id}`; //The refresh of the UI at the end of this function, will trigger the intro animation of the todoitems. And when that intro animation ends (on:introend) AKA once the todoitem is visible in the UI, the value of this variable will be used to scroll to the "add new todo item" button of the checklist
        idTodoItemToFocus = `todo-${newTodoId}`; //In the same way as above, this will be used to select the newly added todo item so it can be edited without having to click on it; once the todoitem's intro animation ends (=by using the introanimation to do this action we know that the elment exist in the DOM. Else we wouldn't be playing/finishing an intro animation. And we need to make sure the element exists in the DOM or else writing element.focus() in this function here would throw an error since the element of this todo isn't present in the DOM yet.

        saveCardFunction();
        cardToSave = cardToSave; //Refresh UI
    }

    let typingTimer;                //timer identifier
    let doneTypingInterval = 5000;  //time in ms
    //This function should be added as a "keyup" event listener to whatever element that should be used to check whether or not the user stopped typing
    function waitUntilUserStoppedTyping(callback)
    {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(callback, doneTypingInterval);
    }

    onDestroy(() => {
        clearTimeout(typingTimer);
    })

    /**
     * Moves a checklist within a card's list of checklists by a specified amount.
     *
     * @param {number} checklistIndex - The current index of the checklist to be moved.
     * @param {number} amount - The number of positions to move the checklist by (positive or negative).
     */
    function moveChecklist(checklistIndex: number, amount: number)
    {
        let tempChecklist = cardToSave.checklists[checklistIndex];

        cardToSave.checklists[checklistIndex] = cardToSave.checklists[checklistIndex + amount];
        cardToSave.checklists[checklistIndex + amount] = tempChecklist;

        saveCardFunction();
        focusOnCardDetailsFunction(); // If we don't focus on the CardDetails component after the user clicked on a button of this CheckLists component to change the order of the lists. The CardDetails component won't register any keyboard shortcuts like "Esc", since it wouldn't be focussed.
    }
</script>

{#if cardToSave.checklists.length > 0}
    <hr>
    {#each cardToSave.checklists as checklist, i (checklist.id)}
        <div animate:flip="{{duration: 500}}">
            <div class="checklistTop">
                <div id={`checklistTopTitleHolder-${checklist.id}`} class="checklistTopTitleHolder">
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M168.531 215.469l-29.864 29.864 96 96L448 128l-29.864-29.864-183.469 182.395-66.136-65.062zm236.802 189.864H106.667V106.667H320V64H106.667C83.198 64 64 83.198 64 106.667v298.666C64 428.802 83.198 448 106.667 448h298.666C428.802 448 448 428.802 448 405.333V234.667h-42.667v170.666z"></path></svg>
                    <span role="textbox" contenteditable="plaintext-only" data-txt-content={I18n.t("checklist")}
                          on:input={(e) => checklist.title = e.target.textContent}
                          on:focus={() => {setTypingFunction(true); document.getElementById(`checklistTopTitleHolder-${checklist.id}`).classList.add("typingChecklistTitle")}}
                          on:focusout={() => {setTypingFunction(false); document.getElementById(`checklistTopTitleHolder-${checklist.id}`).classList.remove("typingChecklistTitle")}}
                          on:keydown={e => {
                              if (e.keyCode === 13 && e.target.matches(":hover"))
                              {//If we press enter and we are hovering over the element.
                                  e.preventDefault(); //Basically captures the event and makes it so no enter/new lines can be typed.
                              }
                              else if (e.keyCode === 13 && !e.target.matches(":hover"))
                              {//We pressed enter and are not hovering over the element
                                  e.target.blur(); //Unfocus the span so that it makes it seem like when pressing enter we stop editing the span
                              }
                          }}
                          on:keyup={() => waitUntilUserStoppedTyping(saveCardFunction)}
                    >
                        {SaveLoadManager.getData().getCard($selectedBoardId, $selectedCardId)?.checklists[i].title}
                    </span>
                    <!--In principe is het logischer dat we {checklist.title} schrijven in plaats van {SaveLoadManager.getData().getCard($selectedBoardId, $selectedCardId).cheklists[i].title}. Maar dan hadden we het probleem dat wanneer de checklist nog geen titel had. Dat wanneer we een titel begonnen te typen elke toetsaanslag dubbel in de span zichtbaar was. Waarschijnlijk omdat we in on:input de waarde van checklist.title setten en dan die hier weer toonden. Op deze manier met de SaveLoadManager hebben we geen last meer van die bug-->
                </div>
                <div class="checklistTopButtonsHolder">
                    {#if i !== 0}
                        <!--We don't want the user to move up the first checklist-->
                        <button title={I18n.t("moveChecklistUp")}
                                on:click={() => moveChecklist(i, -1)}
                        >
                            <svg stroke="currentColor" fill="currentColor" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M256 217.9L383 345c9.4 9.4 24.6 9.4 33.9 0 9.4-9.4 9.3-24.6 0-34L273 167c-9.1-9.1-23.7-9.3-33.1-.7L95 310.9c-4.7 4.7-7 10.9-7 17s2.3 12.3 7 17c9.4 9.4 24.6 9.4 33.9 0l127.1-127z"></path></svg>
                        </button>
                    {/if}
                    {#if i + 1 !== cardToSave.checklists.length}
                        <!--We don't want the user to move down the last checklist-->
                        <button title={I18n.t("moveChecklistDown")}
                                on:click={() => moveChecklist(i, 1)}
                        >
                            <svg stroke="currentColor" fill="currentColor" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M256 294.1L383 167c9.4-9.4 24.6-9.4 33.9 0s9.3 24.6 0 34L273 345c-9.1 9.1-23.7 9.3-33.1.7L95 201.1c-4.7-4.7-7-10.9-7-17s2.3-12.3 7-17c9.4-9.4 24.6-9.4 33.9 0l127.1 127z"></path></svg>
                        </button>
                    {/if}
                    <button title={I18n.t("delete")} on:click={async () => {
                        const popup = new PopupWindow({props: {description: I18n.t("confirmChecklistRemoval"), buttonType: "yesno"}, target: document.body, intro: true});

                        if (await popup.getAnswer() === true)
                        {
                            cardToSave.checklists = cardToSave.checklists.filter(checklistt => checklistt.id !== checklist.id)
                            saveCardFunction();
                        }

                        focusOnCardDetailsFunction(); // If we don't focus on the CardDetails component after the user clicked on a button of this CheckLists component. The CardDetails component won't register any keyboard shortcuts like "Esc", since it wouldn\'t be focussed.
                    }}>
                        {I18n.t("delete")}
                    </button>
                </div>
            </div>
            <div class="checklistProgressBar">
                <span id={`checklist-span-${checklist.id}`}>
                    {isNaN(Math.round((amountOfTodosInChecklistFunction(checklist, true) / amountOfTodosInChecklistFunction(checklist)) * 100)) ? 0 : Math.round((amountOfTodosInChecklistFunction(checklist, true) / amountOfTodosInChecklistFunction(checklist)) * 100)}%
                </span>
                <progress id={`checklist-progress-${checklist.id}`} value={tweenProgressBarValue(checklist.id, amountOfTodosInChecklistFunction(checklist, true) / amountOfTodosInChecklistFunction(checklist))}/>
            </div>
            <div class="todosHolder" use:dndzone={{items: checklist.todos, type:"todo", dropTargetStyle: {}, zoneTabIndex: -1}} on:consider={e => checklist.todos = e.detail.items} on:finalize={e => checklist.todos = e.detail.items}>
                {#each checklist.todos as todo, j (todo.id)}
                    <div class="todoContainer"
                         in:slide|global={{duration: 0}}
                         on:introend={() => {
                             if (idTodoItemToFocus === `todo-${todo.id}`)
                             {
                                 document.getElementById(`todo-${todo.id}`).focus(); //Focusing on the span makes it so it\'s being edited
                                 idTodoItemToFocus = "";
                             }
                             if (idAddTodoItemButtonToScrollTo === `addTodoButton-${checklist.id}`)
                             {
                                 document.getElementById(`addTodoButton-${checklist.id}`).scrollIntoView({ behavior: 'smooth', block: 'end' });
                                 idAddTodoItemButtonToScrollTo = "";
                             }
                         }}
                    >
                        <input
                                type="checkbox"
                                checked={todo.completed}
                                on:input={e => {
                                    todo.completed = e.target.checked;
                                    saveCardFunction();
                                }}
                        />
                        <textarea
                              id={`todo-${todo.id}`}
                              style={`text-decoration: ${todo.completed ? "line-through" : "none"}`}
                              bind:value={todo.content}
                              on:focus={() => setTypingFunction(true)}
                              on:focusout={() => setTypingFunction(false)}
                              on:keydown={e => {
                                  if (e.keyCode === 13)
                                  {// If Enter is pressed, create a new todo item
                                      e.preventDefault();
                                      addTodoItem(checklist);
                                  }
                              }}
                              on:keyup={() => waitUntilUserStoppedTyping(saveCardFunction)}
                              spellcheck="false"
                        />
                        <svg stroke="currentColor" fill="none" stroke-width="0" viewBox="0 0 15 15" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5.5 4.625C6.12132 4.625 6.625 4.12132 6.625 3.5C6.625 2.87868 6.12132 2.375 5.5 2.375C4.87868 2.375 4.375 2.87868 4.375 3.5C4.375 4.12132 4.87868 4.625 5.5 4.625ZM9.5 4.625C10.1213 4.625 10.625 4.12132 10.625 3.5C10.625 2.87868 10.1213 2.375 9.5 2.375C8.87868 2.375 8.375 2.87868 8.375 3.5C8.375 4.12132 8.87868 4.625 9.5 4.625ZM10.625 7.5C10.625 8.12132 10.1213 8.625 9.5 8.625C8.87868 8.625 8.375 8.12132 8.375 7.5C8.375 6.87868 8.87868 6.375 9.5 6.375C10.1213 6.375 10.625 6.87868 10.625 7.5ZM5.5 8.625C6.12132 8.625 6.625 8.12132 6.625 7.5C6.625 6.87868 6.12132 6.375 5.5 6.375C4.87868 6.375 4.375 6.87868 4.375 7.5C4.375 8.12132 4.87868 8.625 5.5 8.625ZM10.625 11.5C10.625 12.1213 10.1213 12.625 9.5 12.625C8.87868 12.625 8.375 12.1213 8.375 11.5C8.375 10.8787 8.87868 10.375 9.5 10.375C10.1213 10.375 10.625 10.8787 10.625 11.5ZM5.5 12.625C6.12132 12.625 6.625 12.1213 6.625 11.5C6.625 10.8787 6.12132 10.375 5.5 10.375C4.87868 10.375 4.375 10.8787 4.375 11.5C4.375 12.1213 4.87868 12.625 5.5 12.625Z" fill="currentColor"></path></svg>
                        <svg class="deleteTodoButton" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                             on:click={() => {
                                 checklist.todos = checklist.todos.filter(todoo => todoo.id !== todo.id);
                                 saveCardFunction();
                             }}
                        >
                            <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clip-rule="evenodd" />
                        </svg>
                    </div>
                {/each}
            </div>
            <button
                id={`addTodoButton-${checklist.id}`}
                class="addTodoButton"
                style={`margin-bottom: ${i === cardToSave.checklists.length - 1 ? "0.5em" : "2em"}`}
                on:click={() => addTodoItem(checklist)}
            >
                {I18n.t("addItem")}
            </button>
        </div>
    {/each}
{/if}

<style>
    hr {
        border: 1px solid var(--border);
    }

    .checklistTop {
        display: flex;
        flex-flow: row wrap;
        align-items: center;
        gap: 0.5em;
    }

    .checklistTopTitleHolder {
        border: 2px solid transparent;
        border-radius: 0.5em;
        transition: 0.3s;
        display: flex;
        align-items: center;
        gap: 0.5em;
    }

    .checklistTopTitleHolder:hover, :is(.typingChecklistTitle) {
        border: 2px solid var(--accent);
        box-shadow: none;
    }

    .checklistTopTitleHolder span {
        font-weight: bold;
        font-size: large;
        padding: 0.25em 0.25em;
        background: none;
        cursor: text;
        word-break: break-all;
        box-shadow: none;
    }

    .checklistTopTitleHolder span[contenteditable]:empty::before {
        content: attr(data-txt-content);
    }

    .checklistTopTitleHolder svg {
        min-width: 1.5em;
        max-width: 1.5em;
    }

    .checklistTopButtonsHolder {
        display: inline-flex;
        gap: 0.5em;
        margin-left: auto;
    }

    .checklistTopButtonsHolder button {
        border: none;
        background: var(--border);
        padding: 0.5em;
        font-size: medium;
        border-radius: 4px;
        transition: 0.3s;
        display: flex;
        align-items: center;
    }

    .checklistTopButtonsHolder button:hover {
        cursor: pointer;
        background: var(--unselected-button);
    }

    .checklistTopButtonsHolder button svg {
        height: 1.25em;
    }

    .checklistProgressBar {
        display: flex;
        gap: 1em;
        margin-top: 0.5em;
        align-items: center;
        margin-left: 0.25em;
    }

    .checklistProgressBar span {
        font-size: small;
        font-weight: 300;
    }

    .checklistProgressBar progress {
        flex: 1;
        accent-color: var(--accent);
        height: 1.2em;
    }

    .checklistProgressBar progress[value="1"]{
        accent-color: #1f845a;
    }

    [type=checkbox] {
        width: 1.5em;
        height: 1.5em;
        color: var(--accent);
        vertical-align: middle;
        -webkit-appearance: none;
        background: none;
        outline: 0;
        flex-grow: 0;
        border-radius: 0.25em;
        transition: background 300ms;
        cursor: pointer;
    }

    [type=checkbox]::before {
        content: "";
        color: transparent;
        display: block;
        width: inherit;
        height: inherit;
        border-radius: inherit;
        border: 0;
        background-color: transparent;
        background-size: contain;
        box-shadow: inset 0 0 0 2px var(--border);
        transition: 0.3s;
    }

    [type=checkbox]:hover::before {
        box-shadow: inset 0 0 0 2px var(--unselected-button);
    }

    [type=checkbox]:checked {
        background-color: currentcolor;
    }

    [type=checkbox]:checked::before {
        box-shadow: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='2 2 20 20'%3E %3Cpath d='M15.88 8.29L10 14.17l-1.88-1.88a.996.996 0 1 0-1.41 1.41l2.59 2.59c.39.39 1.02.39 1.41 0L17.3 9.7a.996.996 0 0 0 0-1.41c-.39-.39-1.03-.39-1.42 0z' fill='%23fff'/%3E %3C/svg%3E");
    }

    [type=checkbox]:disabled {
        background-color: #CCD3D8;
        opacity: 0.84;
        cursor: not-allowed;
    }

    .todosHolder {
        margin-top: 0.5em;
        display: flex;
        flex-direction: column;
        gap: 0.75em;
    }

    .todoContainer {
        display: flex;
        align-items: center;
        gap: 0.5em;
        align-content: space-around;
    }

    .todoContainer textarea {
        width: 100%;
        transition: 0.2s;
        border: none;
        border-radius: 0.25em;
        padding: 0.25em;
        word-break: break-word;
        background: transparent;
        font-size: medium;
        resize: none;
        field-sizing: content;
    }

    .todoContainer svg {
        min-width: 1.25em;
        max-width: 1.25em;
        color: var(--unselected-button);
        transition: 0.3s;
    }

    .deleteTodoButton:hover {
        cursor: pointer;
        color: var(--danger)
    }

    .addTodoButton {
        margin-top: 0.75em;
        border: none;
        background: var(--border);
        padding: 0.5em;
        font-size: medium;
        border-radius: 4px;
        transition: 0.3s;
        width: 100%;
    }

    .addTodoButton:hover {
        cursor: pointer;
        background: var(--unselected-button);
    }
</style>