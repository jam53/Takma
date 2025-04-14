<script lang="ts">
    import {I18n} from "../../scripts/I18n/I18n";
    import {listsSortOrder, selectedBoardId} from "../../scripts/Stores.svelte";
    import type {List} from "../../scripts/Board";
    import OptionsMenu from "../OptionsMenu.svelte";

    interface Props {
        clickEvent: MouseEvent,
    }

    let { clickEvent }: Props = $props();

    function setSortOrderAndClose(sortOrder: (a: List, b: List) => number)
    {
        listsSortOrder.value = sortOrder;
        optionsMenu.closeContextMenu()
    }

    let menuItems = [
        {
            'name': 'sortByCreationDate(Ascending)',
            'onClick': () => setSortOrderAndClose((a, b) => a.creationDate - b.creationDate),
            'displayText': I18n.t("sortByCreationDateAscending"),
            'svg': '<svg class="listOptionsMenuIcons" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25"/></svg>'
        },
        {
            'name': 'sortByCreationDate(Descending)',
            'onClick': () => setSortOrderAndClose((a, b) => b.creationDate - a.creationDate),
            'displayText': I18n.t("sortByCreationDateDescending"),
            'svg': '<svg class="listOptionsMenuIcons" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12"/></svg>'
        },
        {
            'name': 'hr'
        },
        {
            'name': 'sortAlphabetically(Ascending)',
            'onClick': () => setSortOrderAndClose((a, b) => a.title.localeCompare(b.title)),
            'displayText': I18n.t("sortAlphabeticallyAscending"),
            'svg': '<svg class="listOptionsMenuIcons" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25"/></svg>'
        },
        {
            'name': 'sortAlphabetically(Descending)',
            'onClick': () => setSortOrderAndClose((a, b) => b.title.localeCompare(a.title)),
            'displayText': I18n.t("sortAlphabeticallyDescending"),
            'svg': '<svg class="listOptionsMenuIcons" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12"/></svg>'
        },
        {
            'name': 'hr'
        },
        {
            'name': 'sortShuffle',
            'onClick': () => setSortOrderAndClose((a, b) => Math.random() - 0.5),
            'displayText': I18n.t("shuffle"),
            'svg': '<svg class="listOptionsMenuIcons" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><path d="M237.66,178.34a8,8,0,0,1,0,11.32l-24,24A8,8,0,0,1,200,208V192a72.15,72.15,0,0,1-57.65-30.14l-41.72-58.4A56.1,56.1,0,0,0,55.06,80H32a8,8,0,0,1,0-16H55.06a72.12,72.12,0,0,1,58.59,30.15l41.72,58.4A56.08,56.08,0,0,0,200,176V160a8,8,0,0,1,13.66-5.66ZM143,107a8,8,0,0,0,11.16-1.86l1.2-1.67A56.08,56.08,0,0,1,200,80V96a8,8,0,0,0,13.66,5.66l24-24a8,8,0,0,0,0-11.32l-24-24A8,8,0,0,0,200,48V64a72.15,72.15,0,0,0-57.65,30.14l-1.2,1.67A8,8,0,0,0,143,107Zm-30,42a8,8,0,0,0-11.16,1.86l-1.2,1.67A56.1,56.1,0,0,1,55.06,176H32a8,8,0,0,0,0,16H55.06a72.12,72.12,0,0,0,58.59-30.15l1.2-1.67A8,8,0,0,0,113,149Z"></path></svg>'
        },
    ];

    let optionsMenu: ReturnType<typeof OptionsMenu>;
</script>

<OptionsMenu
        bind:this={optionsMenu}
        {clickEvent}
        logMessage={`Opening order lists menu in board: ${selectedBoardId.value}`}
        {menuItems}
/>