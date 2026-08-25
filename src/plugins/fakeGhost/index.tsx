/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import definePlugin from "@utils/types";
import { doiksubDevs } from "@utils/constants";
import { findByProps } from "@webpack";
import { Menu, React } from "@webpack/common";

let isGhostActive = true;
let configFakeMute = true;
let configFakeDeafen = true;

const syncState = () => {
    const SelectedChannelStore = findByProps("getVoiceChannelId");
    const vm = findByProps("toggleSelfMute");
    if (vm && SelectedChannelStore?.getVoiceChannelId()) {
        vm.toggleSelfMute();
        vm.toggleSelfMute();
    }
};

function GhostContextMenu() {
    const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0);
    return (
        <Menu.Menu navId="fake-voice-menu" aria-label="Configuration Fake Voice">
            <Menu.MenuGroup label="Options du Fantôme">
                <Menu.MenuCheckboxItem
                    id="opt-both"
                    label="Fake Mute & Deafen"
                    checked={configFakeMute && configFakeDeafen}
                    action={() => {
                        const nextState = !(configFakeMute && configFakeDeafen);
                        configFakeMute = nextState;
                        configFakeDeafen = nextState;
                        forceUpdate();
                    }}
                />
                <Menu.MenuSeparator />
                <Menu.MenuCheckboxItem
                    id="opt-mute"
                    label="Fake Mute"
                    checked={configFakeMute}
                    action={() => {
                        configFakeMute = !configFakeMute;
                        forceUpdate();
                    }}
                />
                <Menu.MenuCheckboxItem
                    id="opt-deafen"
                    label="Fake Deafen"
                    checked={configFakeDeafen}
                    action={() => {
                        configFakeDeafen = !configFakeDeafen;
                        forceUpdate();
                    }}
                />
            </Menu.MenuGroup>
        </Menu.Menu>
    );
}


export default definePlugin({
    name: "FakeVoice",
    description: "Appear muted or deaf.",
    authors: [doiksubDevs.sqz],
    tags: ["Sigil"],
    dependencies: ["UserAreaAPI"],
    enabledByDefault: true,

    patches: [
        {
            find: "}voiceStateUpdate(",
            replacement: {
                match: /self_mute:([^,]+),self_deaf:([^,]+),self_video:([^,]+)/,
                replace: "self_mute:$self.toggle($1,'mute'),self_deaf:$self.toggle($2,'deaf'),self_video:$self.toggle($3,'video')"
            }
        }
    ],

    toggle(val: any, what: string) {
        if (!isGhostActive) return val;
        switch (what) {
            case "mute": return configFakeMute ? true : val;
            case "deaf": return configFakeDeafen ? true : val;
            case "video": return val;
        }
    },

    toolboxActions: {
        "Ghost Mute": () => {
            configFakeMute = !configFakeMute;
            isGhostActive = configFakeMute;
            syncState();
        },
        "Ghost Deafen": () => {
            configFakeDeafen = !configFakeDeafen;
            isGhostActive = configFakeDeafen;
            syncState();
        },
        "Ghost Mute & Deafen": () => {
            const next = !(configFakeMute && configFakeDeafen);
            configFakeMute = next;
            configFakeDeafen = next;
            isGhostActive = next;
            syncState();
        },
    },

});