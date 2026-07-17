/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import type { Channel, VoiceState } from "@vencord/discord-types";
import { findByPropsLazy } from "@webpack";
import { Menu, React, UserStore, VoiceStateStore } from "@webpack/common";

const ChannelActions = findByPropsLazy("selectVoiceChannel");

let stickyChannelId: string | null = null;
let isMoving = false;

const settings = definePluginSettings({
    autoReconnect: {
        type: OptionType.BOOLEAN,
        description: "Automatically reconnect to the locked channel if moved or disconnected.",
        default: true,
    },
});

export default definePlugin({
    name: "StickyVoiceChannel",
    description: "Lock yourself to a voice channel and automatically reconnect if moved or disconnected.",
    authors: [{ name: "yungpharaoh", id: 1136337246631497849n }],
    settings,

    contextMenus: {
        "channel-context": (children, { channel }: { channel: Channel; }) => {
            if (!channel || (channel.type !== 2 && channel.type !== 13)) return;

            const isSticky = stickyChannelId === channel.id;

            children.splice(
                -1,
                0,
                <Menu.MenuSeparator />,
                <Menu.MenuItem
                    id="sticky-voice-lock"
                    label={isSticky ? "Unlock from Channel" : "Lock to Channel"}
                    action={() => {
                        if (isSticky) {
                            stickyChannelId = null;
                        } else {
                            stickyChannelId = channel.id;
                            const myUserId = UserStore.getCurrentUser().id;
                            const myState = VoiceStateStore.getVoiceStateForUser(myUserId);
                            if (myState?.channelId !== channel.id) {
                                ChannelActions.selectVoiceChannel(channel.id);
                            }
                        }
                    }}
                />
            );
        }
    },

    flux: {
        VOICE_STATE_UPDATES({ voiceStates }: { voiceStates: VoiceState[]; }) {
            if (!settings.store.autoReconnect || !stickyChannelId || isMoving) return;

            const myUserId = UserStore.getCurrentUser()?.id;
            if (!myUserId) return;

            const myState = voiceStates.find(s => s.userId === myUserId);
            if (!myState) return;

            if (myState.channelId !== stickyChannelId) {
                isMoving = true;
                ChannelActions.selectVoiceChannel(stickyChannelId);
                setTimeout(() => isMoving = false, 1000);
            }
        }
    },

    stop() {
        stickyChannelId = null;
    }
});
