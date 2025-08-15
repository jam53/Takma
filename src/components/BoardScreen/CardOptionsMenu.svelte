<script lang="ts">
    import {SaveLoadManager} from "../../scripts/SaveLoad/SaveLoadManager";
    import {copiedCard, selectedBoardId} from "../../scripts/Stores.svelte.js";
    import {I18n} from "../../scripts/I18n/I18n";
    import {type Card, duplicateCard as duplicateCardObject, type List, openReadOnlyWindow} from "../../scripts/Board";
    import OptionsMenu from "../OptionsMenu.svelte";
    import {mount} from "svelte";
    import PopupWindow from "../PopupWindow.svelte";

    interface Props {
        clickEvent: MouseEvent;
        card: Card;
        list: List;
        setList: (list: List) => void; // Unfortunately we can't create a two-way binding using `$bindable()` since this component gets created using the `mount()` method which doesn't allow for two-way binding as creating a component with `<Foo bind:bar={value}/>` does. Hence the workaround using `setBar()`. The reason we don't need a `setCard()` function is that we never replace a card using `card = `, we only change the card object's properties using `card.property = `. Since the card object being passed to this prop is a `$state()` object, any changes we make by modifying the properties will be reflected in the parent component, hence why we don't need a separate `setCard()` function
    }

    let { clickEvent, card, list, setList }: Props = $props();

    async function duplicateCard()
    {
        let thisCardIndex = list.cards.findIndex(c => c.id === card.id);
        let duplicatedCard = await duplicateCardObject($state.snapshot(card), selectedBoardId.value);

        SaveLoadManager.getData().addCardToList(duplicatedCard, selectedBoardId.value, list.id, thisCardIndex);

        setList(SaveLoadManager.getData().getList(selectedBoardId.value, list.id));
        optionsMenu.closeContextMenu();
    }

    async function deleteCard()
    {
        optionsMenu.closeContextMenu();

        const deleteCardFunction = async () => {
            SaveLoadManager.getData().deleteCard(selectedBoardId.value, card.id);
            setList(SaveLoadManager.getData().getList(selectedBoardId.value, list.id));
        }

        if (!SaveLoadManager.getData().showConfirmationPreferences.deleteCard)
        {
            await deleteCardFunction();
        }
        else
        {
            const popup = mount(PopupWindow, {props: {description: I18n.t("confirmCardRemoval"), buttonType: "yesno", showConfirmation: true}, target: document.body, intro: true});

            if (await popup.getAnswer() === true)
            {
                await SaveLoadManager.getData().updateConfirmationPreference("deleteCard", popup.getShowConfirmationAgain());
                await deleteCardFunction();
            }
        }
    }

    /**
     * Copies the current card data to the `copiedCard` store.
     * This prepares the card for pasting elsewhere.
     */
    async function copyCard()
    {
        // Create a deep copy of the card structure
        copiedCard.card = await duplicateCardObject($state.snapshot(card), "", false, true);

        // Fetch the full Label objects corresponding to this card's label IDs from the current (source) board.
        // These original label definitions are stored alongside the copied card data.
        copiedCard.referencedLabels = $state.snapshot(card).labelIds.map(labelId => SaveLoadManager.getData().getLabel(selectedBoardId.value, labelId));

        optionsMenu.closeContextMenu();
    }

    /**
     * Pastes the card from the `copiedCard` store into the current list,
     * inserting it after the card where the paste action was triggered.
     * Handles label reconciliation between the source and target boards.
     */
    async function pasteCard()
    {
        // Determine the insertion index for the new card (paste after the current card)
        let thisCardIndex = list.cards.findIndex(c => c.id === card.id);

        // Create a new, independent instance of the copied card, generating a fresh ID.
        // We will set the list ID association when adding it to the list.
        // Note: `copiedCard.card!` is safe due to the visibility check on the paste button.
        let cardToPaste = await duplicateCardObject($state.snapshot(copiedCard.card!), selectedBoardId.value, true, false);

        // Reconcile the labels from the original copied card (`copiedCard.referencedLabels`)
        // with the labels existing on the *target* board (`selectedBoardId.value`).
        // This function adds missing labels to the target board and returns a map
        // indicating which original label IDs need to be replaced with new IDs on the target board.
        // Map format: { originalLabelId: newLabelIdOnTargetBoard }
        const labelIdUpdates = SaveLoadManager.getData().createMissingLabelsInBoard(selectedBoardId.value, $state.snapshot(copiedCard.referencedLabels));

        // If any label IDs were updated during reconciliation, update the label references
        // in the card we are about to paste.
        if (labelIdUpdates.size > 0)
        {
            // Replace any old label IDs with their corresponding new IDs.
            // `?? labelId` keeps the ID if it wasn't in the update map (meaning it was okay).
            cardToPaste.labelIds = cardToPaste.labelIds.map(labelId => labelIdUpdates.get(labelId) ?? labelId);
        }

        // Add the fully prepared card (with potentially updated label IDs) to the target list
        SaveLoadManager.getData().addCardToList(cardToPaste, selectedBoardId.value, list.id, thisCardIndex);

        setList(SaveLoadManager.getData().getList(selectedBoardId.value, list.id));
        optionsMenu.closeContextMenu();
    }

    function completeCard()
    {
        card.complete = !card.complete;
        SaveLoadManager.getData().updateCard(card, selectedBoardId.value, card.id);
        optionsMenu.closeContextMenu();
    }

    let menuItems = [
        {
            'name': 'duplicateCard',
            'onClick': duplicateCard,
            'displayText': I18n.t("duplicateCard"),
            'svg': '<svg class="listOptionsMenuIcons" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5"> <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6" /></svg>'
        },
        {
            'name': 'completeCard',
            'onClick': completeCard,
            'displayText': card.complete ? I18n.t("markAsIncomplete") : I18n.t("markAsComplete"),
            'svg': '<svg stroke="currentColor" style="margin: 0 0.15em 0 0.15em" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"></path></svg>'
        },
        {
            'name': 'hr',
        },
        {
            'name': 'copyCard',
            'onClick': copyCard,
            'displayText': I18n.t("copyCard"),
            'svg': '<svg class="listOptionsMenuIcons" stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"></path><path d="M16 4h2a2 2 0 0 1 2 2v4"></path><path d="M21 14H11"></path><path d="m15 10-4 4 4 4"></path></svg>'
        },
        {
            'name': 'pasteCard',
            'onClick': pasteCard,
            'isVisibleFunction': () => copiedCard.card !== null,
            'displayText': I18n.t("pasteCard"),
            'svg': '<svg class="listOptionsMenuIcons" stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><path d="M15 2H9a1 1 0 0 0-1 1v2c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V3c0-.6-.4-1-1-1Z"></path><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2M16 4h2a2 2 0 0 1 2 2v2M11 14h10"></path><path d="m17 10 4 4-4 4"></path></svg>'
        },
        {
            'name': 'hr',
        },
        {
            'name': 'deleteCard',
            'onClick': deleteCard,
            'displayText': I18n.t("deleteCard"),
            'svg': '<svg class="listOptionsMenuIcons" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clip-rule="evenodd"/></svg>'
        },
    ];

    let optionsMenu: ReturnType<typeof OptionsMenu>;
</script>

<OptionsMenu
        bind:this={optionsMenu}
        {clickEvent}
        logMessage={"Opening card options menu for card: " + card.id}
        {menuItems}
/>
