<script lang="ts">
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager.js";
    import {selectedBoardId, selectedCardId} from "../../scripts/stores.js";
    import {tweened} from "svelte/motion";
    import {cubicOut} from "svelte/easing";

    export let cardToSave;
    export let setTypingFunction;

    export let amountOfTodosInChecklistFunction;

    /**
     * This function is used in the value={} field of the <progress> element for the checklists. We pass the id of the checklist and the new value of this progressbar. This function will then tween from the old value in the progressbar to the new value of the progressbar
     */
    function tweenProgressBarValue(checklistId:string, newValue: number): number
    {
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
</script>

{#if cardToSave.checklists.length > 0}
    <hr>
    {#each cardToSave.checklists as checklist, i}
        <div class="checklistTop">
            <div id="checklistTopTitleHolder" class="checklistTopTitleHolder">
                <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M168.531 215.469l-29.864 29.864 96 96L448 128l-29.864-29.864-183.469 182.395-66.136-65.062zm236.802 189.864H106.667V106.667H320V64H106.667C83.198 64 64 83.198 64 106.667v298.666C64 428.802 83.198 448 106.667 448h298.666C428.802 448 448 428.802 448 405.333V234.667h-42.667v170.666z"></path></svg>
                <span role="textbox" contenteditable="plaintext-only"
                      on:input={(e) => checklist.title = e.target.textContent}
                      on:focus={() => {setTypingFunction(true); document.getElementById("checklistTopTitleHolder").classList.add("typingChecklistTitle")}}
                      on:focusout={() => {setTypingFunction(false); document.getElementById("checklistTopTitleHolder").classList.remove("typingChecklistTitle")}}
                      on:keydown={e => (e.keyCode === 13) && e.preventDefault()}
                >
    <!--This keycode 13 check and e.preventDefault if it was true; prevents the user from typing newlines. If they would copy in new lines, they will be visible while editing the span. But once we close the editing of the span and reopen it, the newline will be gone-->
                    {SaveLoadManager.getData().getCard($selectedBoardId, $selectedCardId)?.checklists[i].title}
                </span>
                <!--In principe is het logischer dat we {checklist.title} schrijven in plaats van {SaveLoadManager.getData().getCard($selectedBoardId, $selectedCardId).cheklists[i].title}. Maar dan hadden we het probleem dat wanneer de checklist nog geen titel had. Dat wanneer we een titel begonnen te typen elke toetsaanslag dubbel in de span zichtbaar was. Waarschijnlijk omdat we in on:input de waarde van checklist.title setten en dan die hier weer toonden. Op deze manier met de SaveLoadManager hebben we geen last meer van die bug-->
            </div>
            <div class="checklistTopButtonsHolder">
                <button>
                    %%Hide checked items
                </button>
                <button>
                    %%Delete
                </button>
            </div>
        </div>
        <div class="checklistProgressBar">
            <span id={`checklist-span-${checklist.id}`}>
                {Math.round((amountOfTodosInChecklistFunction(checklist, true) / amountOfTodosInChecklistFunction(checklist)) * 100)}%
            </span>
            <progress id={`checklist-progress-${checklist.id}`} value={tweenProgressBarValue(checklist.id, amountOfTodosInChecklistFunction(checklist, true) / amountOfTodosInChecklistFunction(checklist))}/>
        </div>
        <div class="todosHolder">
            {#each checklist.todos as todo, j}
                <div class="todoContainer">
                    <input
                            type="checkbox"
                            checked={todo.completed}
                            on:input={e => todo.completed = e.target.checked}
                    />
                    <span role="textbox" contenteditable="plaintext-only"
                          style={`text-decoration: ${todo.completed ? "line-through" : "none"}`}
                          on:input={(e) => todo.content = e.target.textContent}
                          on:focus={() => setTypingFunction(true)}
                          on:focusout={() => setTypingFunction(false)}
                          on:keydown={e => (e.keyCode === 13) && e.preventDefault()}
                    >
    <!--This keycode 13 check and e.preventDefault if it was true; prevents the user from typing newlines. If they would copy in new lines, they will be visible while editing the span. But once we close the editing of the span and reopen it, the newline will be gone-->
                        {SaveLoadManager.getData().getCard($selectedBoardId, $selectedCardId)?.checklists[i].todos[j].content}
                    </span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                         on:click={() => checklist.todos = checklist.todos.filter(todoo => todoo.id !== todo.id)}
                    >
                        <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clip-rule="evenodd" />
                    </svg>
                </div>
            {/each}
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
        content: "%%Checklist";
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
    }

    .checklistTopButtonsHolder button:hover {
        cursor: pointer;
        background: var(--unselected-button);
    }

    .checklistProgressBar {
        display: flex;
        gap: 0.75em;
        margin-top: 0.5em;
        align-items: center;
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
        gap: 1em;
        align-content: space-around;
    }

    .todoContainer span {
        width: 100%;
        cursor: pointer;
        transition: 0.2s;
        border-radius: 0.25em;
        padding: 0.25em;
        word-break: break-word;
    }

    .todoContainer svg {
        min-width: 1.25em;
        max-width: 1.25em;
        color: var(--unselected-button);
        cursor: pointer;
        transition: 0.3s;
    }

    .todoContainer svg:hover {
        color: var(--danger)
    }
</style>