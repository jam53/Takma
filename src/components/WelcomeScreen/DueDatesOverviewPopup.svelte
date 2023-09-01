<svelte:head>
    <style>
        [data-theme="dark"] {
            --dueDateItemBorder: var(--border);
            --dueDateItemBorderDanger: #4d0408;
            --dueDateItemBorderWarning: #814c00;

            --dueDateItemBackground: #2d2d2d;
            --dueDateItemBackgroundDanger: #2d0607;
            --dueDateItemBackgroundWarning: #4b3305;

            --dueDateItemColor: var(--main-text);
            --dueDateItemColorDanger: #ff9ea1;
            --dueDateItemColorWarning: #ffb84d;

            --brightnessOnHover: 130%;
        }

        [data-theme="light"] {
            --dueDateItemBorder: var(--border);
            --dueDateItemBorderDanger: #ff4d52;
            --dueDateItemBorderWarning: #e69500;

            --dueDateItemBackground: #ffffff;
            --dueDateItemBackgroundDanger: #ffdddd;
            --dueDateItemBackgroundWarning: #fff5e0;

            --dueDateItemColor: rgba(var(--main-text-rgb-values), 0.8);
            --dueDateItemColorDanger: #e55259;
            --dueDateItemColorWarning: #eaa336;

            --brightnessOnHover: 90%;
        }
    </style>
</svelte:head>
<script lang="ts">
    import {blur, slide} from "svelte/transition";
    import {onMount} from "svelte";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {selectedBoardId, selectedCardId} from "../../scripts/stores";
    import {I18n} from "../../scripts/I18n/I18n";

    let showPopup = true;

    onMount(() =>
    {
        window.addEventListener("keydown", e => {
            if (e.key === "Escape" || (e.key === "w" && e.ctrlKey))
            {
                showPopup = false;
            }
        });
    });

    function getAllCardsWithDueDates()
    {
        let allDueDates = [];
        SaveLoadManager.getData().boards.forEach(board => {
            board.lists.forEach(list => {
                list.cards.filter(card => card.dueDate !== null).forEach(card =>
                {
                    allDueDates.push({title: "<b>" + board.title + "</b> | " + card.title, dueDate: parseInt(card.dueDate), boardId: board.id, cardId: card.id})
                });
            });
        });

        if ($selectedBoardId !== "")
        {//This will be true in the case that the DueDatesOverviewPopup is opened on the boardscreen. In that case we only want to show the due dates of that board
            allDueDates = allDueDates.filter(dueDate => dueDate.boardId === $selectedBoardId);
        }

        return allDueDates;
    }

    function calculateAllDueDates()
    {
        function removeValueFromArray(array, value)
        {
            let index = array.indexOf(value);
            if (index > -1)
            {
                array.splice(index, 1);
            }
        }

        let allDueDates = getAllCardsWithDueDates();

        return [
            {value: 0, title: I18n.t("overdue"), color: "danger"},
            {value: 24 * 60 * 60 * 1000, title: I18n.t("dueNextDay"), color: "warning"},
            {value: 7 * 24 * 60 * 60 * 1000, title: I18n.t("dueNextWeek"), color: "normal"},
            {value: 30 * 24 * 60 * 60 * 1000, title: I18n.t("dueNextMonth"), color: "normal"},
            {value: 365 * 24 * 60 * 60 * 1000, title: I18n.t("dueNextYear"), color: "normal"},
            {value: 10 * 365 * 24 * 60 * 60 * 1000, title: I18n.t("dueNextDecade"), color: "normal"},
            {value: 100 * 365 * 24 * 60 * 60 * 1000, title: I18n.t("dueNextCentury"), color: "normal"},
        ].map(dueDateValue =>
        {
            let dueDates = [];

            allDueDates.sort((a,b) => a.dueDate - b.dueDate).forEach(dueDate =>
            {

                if (dueDate.dueDate - Date.now() < dueDateValue.value)
                {
                    dueDates.push(dueDate);
                }
            });

            dueDates.forEach(dueDate => removeValueFromArray(allDueDates, dueDate));

            return {
                ...dueDateValue,
                dueDates: dueDates,
            }
        });
    }
</script>

{#if showPopup}
    <div transition:blur|global class="overlay" on:click={() => showPopup = false}>
        <div transition:slide|global class="popup" on:click={(e) => e.stopPropagation()}>
            <!-- When the user clicks outside the popup, the popup should close. However, when the user clicks on the popup itself, the click event should not be captured by the containing/overlay div. In order to prevent the click event from propagating up to the overlay and triggering the closure of the popup, e.stopPropagation() is called-->
            <div class="titleDiv">
                {#if $selectedBoardId === ""}
                    <h1>{I18n.t("dueDatesOverview")}</h1>
                {:else}
                    <h1>{SaveLoadManager.getData().getBoard($selectedBoardId).title + " " + I18n.t("dueDatesOverview")}</h1>
                {/if}
                <svg on:click={() => showPopup = false} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5" >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <hr/>
            {#if getAllCardsWithDueDates().length === 0 && $selectedBoardId === ""}
                <span>{I18n.t("noCardsWithDueDates")}</span>
            {:else if getAllCardsWithDueDates().length === 0 && $selectedBoardId !== ""}
                <span>{I18n.t("noCardsWithDueDatesOnThisBoard")}</span>
            {/if}
            {#each calculateAllDueDates() as dueDateValue}
                {#if dueDateValue.dueDates.length > 0}
                    <h2>{dueDateValue.title}</h2>
                {/if}
                {#each dueDateValue.dueDates as dueDateItem}
                    <div class="dueDateItem" class:danger={dueDateValue.color === "danger"} class:warning={dueDateValue.color === "warning"}
                         on:click={() => {
                             $selectedBoardId = dueDateItem.boardId;
                             $selectedCardId = dueDateItem.cardId;
                             showPopup = false;
                         }}
                    >
                        <h4>
                            {@html dueDateItem.title}
                        </h4>
                        <hr>
                        <span>
                            {(new Date(parseInt(dueDateItem.dueDate))).toLocaleString("default", {dateStyle: "full", timeStyle: "short", hourCycle: 'h23'})}
                        </span>
                    </div>
                {/each}
            {/each}
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

    .popup h1 {
        margin: 0;
    }

    .titleDiv {
        display: flex;
        gap: 5em;
        justify-content: space-between;
        align-items: center;
    }

    .titleDiv svg {
        height: 2em;
        cursor: pointer;
        stroke: var(--unselected-button);
        transition: 0.2s;
    }

    .titleDiv svg:hover {
        stroke: var(--selected-button);
    }

    hr {
        border: 1px solid var(--border);
        margin-bottom: 1em;
    }

    h2 {
        margin-bottom: 0.25em;
    }

    .dueDateItem {
        border: 1px solid currentColor;
        border-radius: 6px;
        padding: 0.5em 0.75em;
        cursor: pointer;
        transition: 0.4s;
        margin-bottom: 0.5em;

        border-color: var(--dueDateItemBorder);
        background-color: var(--dueDateItemBackground);
        color: var(--dueDateItemColor);
    }

    .dueDateItem:hover {
        filter: brightness(var(--brightnessOnHover));
    }

    .danger {
        border-color: var(--dueDateItemBorderDanger);
        background-color: var(--dueDateItemBackgroundDanger);
        color: var(--dueDateItemColorDanger);
    }

    .warning {
        border-color: var(--dueDateItemBorderWarning);
        background-color: var(--dueDateItemBackgroundWarning);
        color: var(--dueDateItemColorWarning);
    }

    .dueDateItem h4 {
        margin: 0;
        word-break: break-all;
        font-weight: unset;
    }

    .dueDateItem span {
        font-weight: 200;
        word-break: break-all;
    }

    .dueDateItem hr {
        border: 1px solid currentColor;
        filter: opacity(50%);
    }
</style>