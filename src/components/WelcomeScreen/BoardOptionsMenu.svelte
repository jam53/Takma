<script lang="ts">
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {copiedBoard} from "../../scripts/Stores.svelte.js";
    import {I18n} from "../../scripts/I18n/I18n";
    import PopupWindow from "../PopupWindow.svelte";
    import {type Board, duplicateBoard as duplicateBoardObject} from "../../scripts/Board";
    import {mount} from "svelte";
    import OptionsMenu from "../OptionsMenu.svelte";

    interface Props {
        clickEvent: MouseEvent;
        board: Board;
        setBoards: (Boards: Board[]) => void; // Unfortunately we can't create a two-way binding using `$bindable()` since this component gets created using the `mount()` method which doesn't allow for two-way binding as creating a component with `<Foo bind:bar={value}/>` does. Hence the workaround using `setBar()`
    }

    let { clickEvent, board, setBoards }: Props = $props();

    async function duplicateBoard()
    {
        optionsMenu.closeContextMenu();
        let thisBoardIndex = SaveLoadManager.getData().boards.findIndex(b => b.id === board.id);
        let duplicatedBoard = await duplicateBoardObject($state.snapshot(board));

        const popupWindow = mount(PopupWindow, {props: {title: I18n.t("createNewBoard"), description: I18n.t("chooseBoardTitle"), inputValue: duplicatedBoard.title, buttonType: "input"}, target: document.body, intro: true});

        if (await popupWindow.getAnswer() === true)
        {
            duplicatedBoard.title = popupWindow.getInputFieldAnswer();

            await SaveLoadManager.getData().createNewBoard(duplicatedBoard.title, duplicatedBoard.backgroundImagePath, false, duplicatedBoard.id, duplicatedBoard.labels, duplicatedBoard.lists, duplicatedBoard.favourite, thisBoardIndex);
            setBoards(SaveLoadManager.getData().boards);
        }
        else
        {
            await SaveLoadManager.getData().deleteBoard(duplicatedBoard.id);
        }
    }

    async function deleteBoard()
    {
        optionsMenu.closeContextMenu();

        const deleteBoardFunction = async () => {
            await SaveLoadManager.getData().deleteBoard(board.id);
            setBoards(SaveLoadManager.getData().boards);
        }

        if (!SaveLoadManager.getData().showConfirmationPreferences.deleteBoard)
        {
            await deleteBoardFunction();
        }
        else
        {
            const popup = mount(PopupWindow, {props: {description: I18n.t("confirmBoardRemoval"), buttonType: "yesno", showConfirmation: true}, target: document.body, intro: true});

            if (await popup.getAnswer() === true)
            {
                await SaveLoadManager.getData().updateConfirmationPreference("deleteBoard", popup.getShowConfirmationAgain());
                await deleteBoardFunction();
            }
        }
    }

    async function copyBoard()
    {
        optionsMenu.closeContextMenu();
        copiedBoard.value = await duplicateBoardObject($state.snapshot(board), false, true);
    }

    async function pasteBoard()
    {
        optionsMenu.closeContextMenu();
        let thisBoardIndex = SaveLoadManager.getData().boards.findIndex(b => b.id === board.id);

        let boardToPaste = await duplicateBoardObject($state.snapshot(copiedBoard.value!), true, false); //Since this function was called, it means the `copiedBoard` variable can't be null. Hadn't there been a board copied i.e. should `copiedBoard` have been null, then the button on which this function gets called wouldn't have been visible

        const popupWindow = mount(PopupWindow, {props: {title: I18n.t("createNewBoard"), description: I18n.t("chooseBoardTitle"), inputValue: boardToPaste.title, buttonType: "input"}, target: document.body, intro: true});

        if (await popupWindow.getAnswer() === true)
        {
            boardToPaste.title = popupWindow.getInputFieldAnswer();

            await SaveLoadManager.getData().createNewBoard(boardToPaste.title, boardToPaste.backgroundImagePath, false, boardToPaste.id, boardToPaste.labels, boardToPaste.lists, boardToPaste.favourite, thisBoardIndex)

            setBoards(SaveLoadManager.getData().boards);
        }
        else
        {
            await SaveLoadManager.getData().deleteBoard(boardToPaste.id);
        }
    }

    let menuItems = [
        {
            'name': 'duplicateBoard',
            'onClick': duplicateBoard,
            'displayText': I18n.t("duplicateBoard"),
            'svg': '<svg class="listOptionsMenuIcons" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"> <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6" /></svg>'
        },
        {
            'name': 'hr',
        },
        {
            'name': 'copyBoard',
            'onClick': copyBoard,
            'displayText': I18n.t("copyBoard"),
            'svg': '<svg class="listOptionsMenuIcons" stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path><path d="M16 4h2a2 2 0 0 1 2 2v4"></path><path d="M21 14H11"></path><path d="m15 10-4 4 4 4"></path></svg>'
        },
        {
            'name': 'pasteBoard',
            'onClick': pasteBoard,
            'displayText': I18n.t("pasteBoard"),
            'svg': '<svg class="listOptionsMenuIcons" stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M15 2H9a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1Z"></path><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2M16 4h2a2 2 0 0 1 2 2v2M11 14h10"></path><path d="m17 10 4 4-4 4"></path></svg>'
        },
        {
            'name': 'hr',
        },
        {
            'name': 'deleteBoard',
            'onClick': deleteBoard,
            'displayText': I18n.t("deleteBoard"),
            'svg': '<svg class="listOptionsMenuIcons" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clip-rule="evenodd"/></svg>'
        },
    ];

    let optionsMenu: ReturnType<typeof OptionsMenu>;
</script>

<OptionsMenu
        bind:this={optionsMenu}
        {clickEvent}
        logMessage={"Opening board options menu for board: " + board.id}
        {menuItems}
/>
