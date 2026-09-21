/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

let initialQuestDataFetched = false;
let settingsModalOpen = false;

export function getInitialQuestDataFetched(): boolean {
    return initialQuestDataFetched;
}

export function setInitialQuestDataFetched(fetched: boolean): void {
    initialQuestDataFetched = fetched;
}

export function setSettingsModalOpen(open: boolean): void {
    settingsModalOpen = open;
}

export function getSettingsModalOpen(): boolean {
    return settingsModalOpen;
}
