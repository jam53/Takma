import "./stylesheets/styles.css";
import "./stylesheets/github-markdown.css";
import "./stylesheets/github-syntax-highlighting.min.css";
import "./stylesheets/coloris.min.css";
import "./stylesheets/easymde.min.css";
import "./stylesheets/font-awesome.min.css";
import "./stylesheets/fonts.css";

import CardDetailsReadOnly from "./components/BoardScreen/CardDetailsReadOnly.svelte";
import {mount} from "svelte";
import {listen} from "@tauri-apps/api/event";
import type {Card, Label} from "./scripts/Board";
import {info} from "@tauri-apps/plugin-log";

interface CardWindowPayload {
    card: Card;
    labels: Label[];
    theme?: string;
    cardIsReadOnlyMessage: string;
    dueDateMessage: string;
    completedMessage: string;
    checklistMessage: string;
    attachmentsMessage: string;
}

const unlisten = await listen<CardWindowPayload>('card-data', async event => {
    unlisten();
    info("Read-only card window opened for card: " + event.payload.card.id)

    if (event.payload.theme) {
        document.documentElement.setAttribute("data-theme", event.payload.theme);
    }


    mount(CardDetailsReadOnly, {
        target: document.getElementById("app")!,
        props: {
            card: event.payload.card,
            labels: event.payload.labels,
            cardIsReadOnlyMessage: event.payload.cardIsReadOnlyMessage,
            dueDateMessage: event.payload.dueDateMessage,
            completedMessage: event.payload.completedMessage,
            checklistMessage: event.payload.checklistMessage,
            attachmentsMessage: event.payload.attachmentsMessage,
        }
    });
});
