<svelte:head>
    <style>
        [data-theme="dark"] {
            --dueDateItemBorder: var(--border);
            --dueDateItemBorderDanger: #4d0408;
            --dueDateItemBorderWarning: #814c00;
            --dueDateItemBorderSuccess: #004d26;

            --dueDateItemBackground: #2d2d2d;
            --dueDateItemBackgroundDanger: #2d0607;
            --dueDateItemBackgroundWarning: #4b3305;
            --dueDateItemBackgroundSuccess: #002d16;

            --dueDateItemColor: var(--main-text);
            --dueDateItemColorDanger: #ff9ea1;
            --dueDateItemColorWarning: #ffb84d;
            --dueDateItemColorSuccess: #98ffb4;

            --brightnessOnHover: 130%;
        }

        [data-theme="light"] {
            --dueDateItemBorder: var(--border);
            --dueDateItemBorderDanger: #ff4d52;
            --dueDateItemBorderWarning: #e69500;
            --dueDateItemBorderSuccess: #00a651;

            --dueDateItemBackground: #ffffff;
            --dueDateItemBackgroundDanger: #ffdddd;
            --dueDateItemBackgroundWarning: #fff5e0;
            --dueDateItemBackgroundSuccess: #e0ffe8;

            --dueDateItemColor: rgba(var(--main-text-rgb-values), 0.8);
            --dueDateItemColorDanger: #e55259;
            --dueDateItemColorWarning: #eaa336;
            --dueDateItemColorSuccess: #228b22;

            --brightnessOnHover: 90%;
        }
    </style>
</svelte:head>
<script lang="ts">
    import {blur, slide} from "svelte/transition";
    import {onMount} from "svelte";
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {dueDatesOverviewPopupIsVisible, selectedBoardId, selectedCardId} from "../../scripts/Stores.svelte.js";
    import {I18n} from "../../scripts/I18n/I18n";
    import { ScheduleXCalendar } from '@schedule-x/svelte';
    import {
        type CalendarEventExternal,
        createCalendar,
        createViewDay,
        createViewMonthAgenda,
        createViewWeek
    } from '@schedule-x/calendar';
    import '@schedule-x/theme-default/dist/index.css';
    import 'temporal-polyfill/global';

    let showPopup = $state(true); dueDatesOverviewPopupIsVisible.value = true;
    let showCalendarView = $state(false);

    onMount(() =>
    {
        window.addEventListener("keydown", listenToKeyDown);
    });

    function listenToKeyDown(e: KeyboardEvent)
    {
        if (e.key === "Escape" || (e.key.toLowerCase() === "w" && e.ctrlKey))
        {
            e.stopPropagation();
            e.preventDefault();
            closePopup();
        }
    }

    function removeKeyDownListeners()
    {
        window.removeEventListener("keydown", listenToKeyDown);
    }

    function closePopup()
    {
        showPopup = false; dueDatesOverviewPopupIsVisible.value = false;
        removeKeyDownListeners();
    }

    interface CardWithDueDate
    {
        titleWithBoardName: string,
        titleWithListName: string,
        dueDate: number,
        boardId: string,
        cardId: string,
        complete: boolean,
    }

    function getAllCardsWithDueDates(): CardWithDueDate[]
    {
        let allDueDates: CardWithDueDate[] = [];
        SaveLoadManager.getData().boards.forEach(board =>
            board.lists.forEach(list =>
                list.cards.filter(card => card.dueDate !== null).forEach(card =>
                    allDueDates.push({
                        titleWithBoardName: "<b>" + board.title + "</b> | " + card.title,
                        titleWithListName: "<b>" + list.title + "</b> | " + card.title,
                        dueDate: parseInt(card.dueDate!),
                        boardId: board.id,
                        cardId: card.id,
                        complete: card.complete
                    }))
            )
        );

        if (selectedBoardId.value !== "")
        {//This will be true in the case that the DueDatesOverviewPopup is opened on the boardscreen. In that case we only want to show the due dates of that board
            allDueDates = allDueDates.filter(dueDate => dueDate.boardId === selectedBoardId.value);
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

        let allCardsWithDueDate = getAllCardsWithDueDates();

        return [
            {value: 0, title: I18n.t("overdue"), color: "danger"},
            {value: 24 * 60 * 60 * 1000, title: I18n.t("dueNextDay"), color: "warning"},
            {value: 7 * 24 * 60 * 60 * 1000, title: I18n.t("dueNextWeek"), color: "normal"},
            {value: 30 * 24 * 60 * 60 * 1000, title: I18n.t("dueNextMonth"), color: "normal"},
            {value: 365 * 24 * 60 * 60 * 1000, title: I18n.t("dueNextYear"), color: "normal"},
            {value: 10 * 365 * 24 * 60 * 60 * 1000, title: I18n.t("dueNextDecade"), color: "normal"},
            {value: 100 * 365 * 24 * 60 * 60 * 1000, title: I18n.t("dueNextCentury"), color: "normal"},
            {value: Number.MIN_SAFE_INTEGER, title: I18n.t("completed"), color: "success"},
        ].map(dueDateValue =>
        {
            let cardsWithDueDate: CardWithDueDate[] = [];

            allCardsWithDueDate.sort((a,b) => a.dueDate - b.dueDate).forEach(card =>
            {
                if (!card.complete && card.dueDate - Date.now() < dueDateValue.value || card.complete && dueDateValue.value === Number.MIN_SAFE_INTEGER)
                {
                    cardsWithDueDate.push(card);
                }
            });

            cardsWithDueDate.forEach(card => removeValueFromArray(allCardsWithDueDate, card));

            return {
                ...dueDateValue,
                dueDates: cardsWithDueDate,
            }
        });
    }

    function openCard(boardId: string, cardId: string) {
        selectedBoardId.value = boardId;
        selectedCardId.value = cardId;
        closePopup();
    }

    function getScheduleXCalendar() {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const removeHtmlTags = (text: string) => text.replace(/<\/?\s?[a-z][^>]*>/gi, "");

        return createCalendar({
            locale: SaveLoadManager.getData().displayLanguage,
            timezone,
            views: [createViewDay(), createViewWeek(), createViewMonthAgenda()],
            isDark: SaveLoadManager.getData().darkTheme,
            showWeekNumbers: true,
            callbacks: {
                onEventClick(calendarEvent: CalendarEventExternal, _: UIEvent) {
                    openCard(calendarEvent.customKeys.boardId, calendarEvent.customKeys.cardId);
                },
            },
            calendars: {
                cards: {
                    colorName: "cards",
                    lightColors: {
                        main: window.getComputedStyle(document.body).getPropertyValue("--accent"),
                        onContainer: window.getComputedStyle(document.body).getPropertyValue("--accent"),
                        container: "#cce4f2",
                    },
                    darkColors: {
                        main: window.getComputedStyle(document.body).getPropertyValue("--accent"),
                        onContainer: window.getComputedStyle(document.body).getPropertyValue("--accent"),
                        container: "#26344b",
                    },
                },
                completedCards: {
                    colorName: "completedCards",
                    lightColors: {
                        main: window.getComputedStyle(document.body).getPropertyValue("--dueDateItemColorSuccess"),
                        container: window.getComputedStyle(document.body).getPropertyValue("--dueDateItemBackgroundSuccess"),
                        onContainer: window.getComputedStyle(document.body).getPropertyValue("--dueDateItemColorSuccess"),
                    },
                    darkColors: {
                        main: window.getComputedStyle(document.body).getPropertyValue("--dueDateItemColorSuccess"),
                        container: window.getComputedStyle(document.body).getPropertyValue("--dueDateItemBackgroundSuccess"),
                        onContainer: window.getComputedStyle(document.body).getPropertyValue("--dueDateItemColorSuccess"),
                    },
                },
            },
            events: getAllCardsWithDueDates().map(cardWithDueDate => {
                return {
                    id: cardWithDueDate.cardId,
                    calendarId: cardWithDueDate.complete ? "completedCards" : "cards",
                    title: removeHtmlTags(selectedBoardId.value === "" ? cardWithDueDate.titleWithBoardName : cardWithDueDate.titleWithListName),
                    start: Temporal.Instant.fromEpochMilliseconds(cardWithDueDate.dueDate).toZonedDateTimeISO(timezone),
                    end: Temporal.Instant.fromEpochMilliseconds(cardWithDueDate.dueDate).toZonedDateTimeISO(timezone).add({hours: 1}),
                    customKeys: {
                        boardId: cardWithDueDate.boardId,
                        cardId: cardWithDueDate.cardId
                    }
                };
            })
        });
    }
</script>

{#if showPopup}
    <div transition:blur|global class="overlay" onclick={closePopup}>
        <div transition:slide|global class="popup" onclick={(e) => e.stopPropagation()}>
            <!-- When the user clicks outside the popup, the popup should close. However, when the user clicks on the popup itself, the click event should not be captured by the containing/overlay div. In order to prevent the click event from propagating up to the overlay and triggering the closure of the popup, e.stopPropagation() is called-->
            <div class="titleDiv">
                {#if selectedBoardId.value === ""}
                    <h1>{I18n.t("dueDatesOverview")}</h1>
                {:else}
                    <h1>{SaveLoadManager.getData().getBoard(selectedBoardId.value).title + " " + I18n.t("dueDatesOverview").toLowerCase()}</h1>
                {/if}
                <svg onclick={closePopup} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5" >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <hr/>
            <button class="calendarListButton"
                    onclick={() => showCalendarView = !showCalendarView}
            >
                {#if showCalendarView}
                    <svg style="width: 1.5em; height: 1.5em" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5"></path></svg>
                {:else}
                    <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg"><path d="M152 24c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40L64 64C28.7 64 0 92.7 0 128l0 16 0 48L0 448c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-256 0-48 0-16c0-35.3-28.7-64-64-64l-40 0 0-40c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 40L152 64l0-40zM48 192l352 0 0 256c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256z"></path></svg>
                {/if}
                <span>
                    {showCalendarView ? I18n.t("openListView") : I18n.t("openCalendarView")}
                </span>
            </button>
            {#if !showCalendarView}
                {#if getAllCardsWithDueDates().length === 0 && selectedBoardId.value === ""}
                    <span>{I18n.t("noCardsWithDueDates")}</span>
                {:else if getAllCardsWithDueDates().length === 0 && selectedBoardId.value !== ""}
                    <span>{I18n.t("noCardsWithDueDatesOnThisBoard")}</span>
                {/if}
                {#each calculateAllDueDates() as dueDateValue}
                    {#if dueDateValue.dueDates.length > 0}
                        <h2>{dueDateValue.title}</h2>
                    {/if}
                    {#each dueDateValue.dueDates as dueDateItem}
                        <div class="dueDateItem" class:danger={dueDateValue.color === "danger"} class:warning={dueDateValue.color === "warning"} class:success={dueDateValue.color === "success"}
                             onclick={() => openCard(dueDateItem.boardId, dueDateItem.cardId)}
                        >
                            <h4>
                                {#if selectedBoardId.value === ""}
                                    {@html dueDateItem.titleWithBoardName}
                                {:else}
                                    {@html dueDateItem.titleWithListName}
                                {/if}
                            </h4>
                            <hr>
                            <span>
                                {(new Date(parseInt(dueDateItem.dueDate))).toLocaleString(SaveLoadManager.getData().displayLanguage, {dateStyle: "full", timeStyle: "short", hourCycle: 'h23'})}
                            </span>
                        </div>
                    {/each}
                {/each}
            {:else}
                <ScheduleXCalendar calendarApp="{getScheduleXCalendar()}" />
            {/if}
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

    .success {
        border-color: var(--dueDateItemBorderSuccess);
        background-color: var(--dueDateItemBackgroundSuccess);
        color: var(--dueDateItemColorSuccess);
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

    .calendarListButton {
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
        color: var(--main-text);
    }

    .calendarListButton:hover {
        filter: brightness(70%);
    }

    .calendarListButton svg {
        width: 1.25em;
        height: 1.25em;
    }

    :global(.sx-svelte-calendar-wrapper) {
        width: 80vw;
    }

    /* Ensure navigation arrows are visible */
    :global(.sx__forward-backward-navigation) {
        display: flex !important;
    }

    /* Ensure today button is visible */
    :global(.sx__today-button) {
        display: inline-block !important;
    }

    :global(.sx__event) {
        cursor: pointer;
    }

    :root, :global(.is-dark) {
        /* The `--sx` related properties are for the ScheduleXCalendar component */
        --sx-color-primary: var(--accent);
        --sx-color-on-primary: white;
        --sx-color-primary-container: var(--border);
        --sx-color-on-primary-container: var(--accent);
        --sx-color-surface-dim: var(--border);
        --sx-color-surface-container: var(--border);
        --sx-color-surface-container-low: var(--border);
        --sx-color-surface-container-high: var(--border);
        --sx-color-background: var(--background-color);
        --sx-color-outline: var(--selected-button);
        --sx-color-outline-variant: var(--border);
    }

    :global(.sx__calendar) {
        border: transparent;
        border-radius: 0;
    }

    :global(.sx__calendar-header__week-number), :global(.is-dark .sx__calendar-header__week-number) {
        background-color: var(--border);
    }

    :global(.sx__month-agenda-week__week-number), :global(.is-dark .sx__month-agenda-week__week-number) {
        background-color: var(--border);
    }
</style>